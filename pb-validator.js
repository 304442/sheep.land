#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

// Simple color functions for console output
const chalk = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  white: (text) => `\x1b[37m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  underline: (text) => `\x1b[4m${text}\x1b[0m`
};

// Configuration
const getConfig = () => {
  const args = process.argv.slice(2);
  const flags = args.filter(arg => arg.startsWith('--'));
  const files = args.filter(arg => !arg.startsWith('--'));
  
  return {
    collectionsFile: files[0] || './pb-collections.json',
    seedFile: files[1] || './pb-seed.json',
    outputFile: process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : null,
    mode: (() => {
      if (flags.includes('--validate')) return 'validate';
      if (flags.includes('--lint')) return 'lint';
      if (flags.includes('--fix')) return 'fix';
      return 'all'; // Default: run all modes
    })(),
    verbose: flags.includes('--verbose'),
    fix: flags.includes('--fix'),
    autoFix: flags.includes('--auto-fix'),
    strict: flags.includes('--strict'),
    format: flags.includes('--json') ? 'json' : 'console'
  };
};

const config = getConfig();

// PocketBase API constraints
const CONSTRAINTS = {
  fieldTypes: [
    'text', 'email', 'url', 'number', 'bool', 'date', 'select', 'json',
    'file', 'relation', 'user', 'editor', 'autodate', 'password'
  ],
  collectionTypes: ['base', 'auth', 'view'],
  fieldLimits: {
    text: { maxLength: 5000 },
    email: { maxLength: 320 },
    url: { maxLength: 2048 },
    password: { minLength: 8, maxLength: 255 },
    select: { maxValues: 100, maxSelect: 100 },
    file: { maxSelect: 99, maxSize: 5368709120 }, // 5GB
    relation: { maxSelect: 100, maxDepth: 6 },
    json: { maxSize: 65536 }, // 64KB
    collectionName: { minLength: 1, maxLength: 32, pattern: /^[a-zA-Z0-9_]+$/ },
    fieldName: { maxLength: 64, pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/ }
  }
};

// Validation results storage
const results = {
  errors: [],
  warnings: [],
  info: [],
  fixes: [],
  stats: {
    totalCollections: 0,
    totalFields: 0,
    totalRecords: 0,
    processingTime: 0
  }
};

// Main validator class
class PocketBaseValidator {
  constructor() {
    this.collections = null;
    this.seedData = null;
    this.fixedData = {
      collections: null,
      seedData: null
    };
  }

  // Load and parse files
  async loadFiles() {
    try {
      // Load collections
      if (fs.existsSync(config.collectionsFile)) {
        const collectionsText = await fs.readFile(config.collectionsFile, 'utf8');
        this.collections = JSON.parse(collectionsText);
        this.fixedData.collections = JSON.parse(JSON.stringify(this.collections));
        results.stats.totalCollections = Array.isArray(this.collections) ? this.collections.length : 0;
      } else {
        this.addError('file', `Collections file not found: ${config.collectionsFile}`);
        return false;
      }

      // Load seed data (optional)
      if (fs.existsSync(config.seedFile)) {
        const seedText = await fs.readFile(config.seedFile, 'utf8');
        this.seedData = JSON.parse(seedText);
        this.fixedData.seedData = JSON.parse(JSON.stringify(this.seedData));
        
        if (this.seedData && typeof this.seedData === 'object') {
          Object.values(this.seedData).forEach(section => {
            if (Array.isArray(section)) {
              results.stats.totalRecords += section.length;
            }
          });
        }
      }

      return true;
    } catch (error) {
      this.addError('file', `Failed to load files: ${error.message}`);
      return false;
    }
  }

  // Add validation result
  addError(type, message, context = null) {
    results.errors.push({ type, message, context, severity: 'error' });
  }

  addWarning(type, message, context = null) {
    results.warnings.push({ type, message, context, severity: 'warning' });
  }

  addInfo(type, message, context = null) {
    results.info.push({ type, message, context, severity: 'info' });
  }

  addFix(type, message, action, context = null) {
    results.fixes.push({ type, message, action, context, applied: false });
  }

  // Validate collections
  validateCollections() {
    if (!Array.isArray(this.collections)) {
      this.addError('collections', 'Collections must be an array');
      return;
    }

    const collectionNames = new Set();
    
    this.collections.forEach((collection, index) => {
      this.validateCollection(collection, index, collectionNames);
    });

    // Check for required collections
    const requiredCollections = ['settings', 'products', 'users', 'orders'];
    const foundNames = this.collections.map(c => c.name).filter(Boolean);
    const missing = requiredCollections.filter(name => !foundNames.includes(name));
    
    if (missing.length > 0) {
      this.addError('collections', `Missing required collections: ${missing.join(', ')}`);
    }
  }

  // Validate single collection
  validateCollection(collection, index, collectionNames) {
    const context = `Collection ${index + 1}${collection.name ? ` (${collection.name})` : ''}`;
    
    // Validate name
    if (!collection.name || typeof collection.name !== 'string') {
      this.addError('collection', 'Missing or invalid name', context);
      return;
    }

    // Check for duplicate names
    if (collectionNames.has(collection.name)) {
      this.addError('collection', `Duplicate collection name: ${collection.name}`, context);
    } else {
      collectionNames.add(collection.name);
    }

    // Validate name constraints
    const nameConstraints = CONSTRAINTS.fieldLimits.collectionName;
    if (!nameConstraints.pattern.test(collection.name)) {
      this.addError('collection', `Invalid name format: ${collection.name} (must be alphanumeric + underscore)`, context);
    }
    
    if (collection.name.length < nameConstraints.minLength || collection.name.length > nameConstraints.maxLength) {
      this.addError('collection', `Invalid name length: ${collection.name} (must be ${nameConstraints.minLength}-${nameConstraints.maxLength} chars)`, context);
    }

    // Validate type
    if (!collection.type || !CONSTRAINTS.collectionTypes.includes(collection.type)) {
      this.addError('collection', `Invalid type: ${collection.type} (must be: ${CONSTRAINTS.collectionTypes.join(', ')})`, context);
    }

    // Validate fields
    if (!Array.isArray(collection.fields)) {
      this.addError('collection', 'Missing or invalid fields array', context);
      return;
    }

    results.stats.totalFields += collection.fields.length;

    collection.fields.forEach((field, fieldIndex) => {
      this.validateField(field, fieldIndex, context, collection.type);
    });

    // Validate API rules
    this.validateAPIRules(collection, context);

    // Validate auth collection options
    if (collection.type === 'auth' && collection.options) {
      this.validateAuthOptions(collection.options, context);
    }

    // Collection-specific validations
    this.validateCollectionSpecifics(collection, context);
  }

  // Validate field
  validateField(field, index, collectionContext, collectionType) {
    const context = `${collectionContext} -> Field ${index + 1}${field.name ? ` (${field.name})` : ''}`;

    // Validate field name
    if (!field.name || typeof field.name !== 'string') {
      this.addError('field', 'Missing or invalid field name', context);
      return;
    }

    const nameConstraints = CONSTRAINTS.fieldLimits.fieldName;
    if (!nameConstraints.pattern.test(field.name)) {
      this.addError('field', `Invalid field name: ${field.name} (must start with letter, alphanumeric + underscore)`, context);
    }

    if (field.name.length > nameConstraints.maxLength) {
      this.addError('field', `Field name too long: ${field.name} (max ${nameConstraints.maxLength} chars)`, context);
    }

    // Validate field type
    if (!field.type || !CONSTRAINTS.fieldTypes.includes(field.type)) {
      this.addError('field', `Invalid field type: ${field.type} (must be: ${CONSTRAINTS.fieldTypes.join(', ')})`, context);
      return;
    }

    // Type-specific validation
    this.validateFieldType(field, context);

    // Common field properties
    this.validateFieldProperties(field, context);
  }

  // Validate field type constraints
  validateFieldType(field, context) {
    const limits = CONSTRAINTS.fieldLimits[field.type];
    if (!limits) return;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'password':
        if (field.max && field.max > limits.maxLength) {
          this.addError('field', `Max length exceeds limit: ${field.max} > ${limits.maxLength}`, context);
        }
        if (field.type === 'password' && field.min && field.min < limits.minLength) {
          this.addError('field', `Min length below requirement: ${field.min} < ${limits.minLength}`, context);
        }
        break;

      case 'select':
        if (field.values && Array.isArray(field.values) && field.values.length > limits.maxValues) {
          this.addError('field', `Too many select values: ${field.values.length} > ${limits.maxValues}`, context);
        }
        if (field.maxSelect && field.maxSelect > limits.maxSelect) {
          this.addError('field', `MaxSelect exceeds limit: ${field.maxSelect} > ${limits.maxSelect}`, context);
        }
        break;

      case 'file':
        if (field.maxSelect && field.maxSelect > limits.maxSelect) {
          this.addError('field', `MaxSelect exceeds limit: ${field.maxSelect} > ${limits.maxSelect}`, context);
        }
        if (field.maxSize && field.maxSize > limits.maxSize) {
          this.addError('field', `MaxSize exceeds limit: ${field.maxSize} > ${limits.maxSize}`, context);
        }
        break;

      case 'relation':
        if (field.maxSelect && field.maxSelect > limits.maxSelect) {
          this.addError('field', `MaxSelect exceeds limit: ${field.maxSelect} > ${limits.maxSelect}`, context);
        }
        if (!field.collectionId) {
          this.addError('field', 'Relation field missing collectionId', context);
        }
        break;
    }
  }

  // Validate field properties
  validateFieldProperties(field, context) {
    const booleanProps = ['required', 'presentable', 'unique'];
    booleanProps.forEach(prop => {
      if (field[prop] !== undefined && typeof field[prop] !== 'boolean') {
        this.addError('field', `Property '${prop}' must be boolean`, context);
      }
    });
  }

  // Validate API rules
  validateAPIRules(collection, context) {
    const rules = ['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule'];
    
    rules.forEach(rule => {
      const ruleValue = collection[rule];
      if (ruleValue !== undefined && ruleValue !== null && typeof ruleValue !== 'string') {
        this.addError('rule', `${rule} must be string or null`, context);
      }

      // Basic syntax validation for non-empty rules
      if (ruleValue && typeof ruleValue === 'string' && ruleValue.trim()) {
        this.validateRuleSyntax(ruleValue, rule, context);
      }
    });
  }

  // Validate rule syntax
  validateRuleSyntax(rule, ruleName, context) {
    const validPatterns = [
      /@request\.auth\.(id|verified|admin)/,
      /@request\.(query|data)\./,
      /@collection\./,
      /\w+\s*[=!<>~?]+/,
      /^""$|^''$/, // Empty string rules
    ];

    const hasValidPattern = validPatterns.some(pattern => pattern.test(rule));
    
    if (!hasValidPattern) {
      this.addWarning('rule', `${ruleName} syntax may be invalid: ${rule}`, context);
      this.addInfo('rule', 'Common patterns: @request.auth.id != "", field = value, @request.auth.admin = true', context);
    }
  }

  // Validate auth options
  validateAuthOptions(options, context) {
    const validOptions = [
      'allowEmailAuth', 'allowUsernameAuth', 'allowOAuth2Auth', 'allowPasswordAuth',
      'requireEmailVerification', 'exceptEmailDomains', 'onlyEmailDomains',
      'minPasswordLength', 'manageRule', 'emailVisibility', 'onlyVerified'
    ];

    Object.keys(options).forEach(key => {
      if (!validOptions.includes(key)) {
        this.addWarning('auth', `Unknown auth option: ${key}`, context);
      }
    });

    if (options.minPasswordLength && (options.minPasswordLength < 5 || options.minPasswordLength > 255)) {
      this.addError('auth', `Invalid minPasswordLength: ${options.minPasswordLength} (must be 5-255)`, context);
    }
  }

  // Validate collection-specific requirements
  validateCollectionSpecifics(collection, context) {
    switch (collection.name) {
      case 'products':
        this.validateProductsCollection(collection, context);
        break;
      case 'orders':
        this.validateOrdersCollection(collection, context);
        break;
      case 'settings':
        this.validateSettingsCollection(collection, context);
        break;
    }
  }

  // Validate products collection
  validateProductsCollection(collection, context) {
    const requiredFields = ['item_key', 'product_category', 'variant_name_en', 'base_price_egp', 'stock_available_pb'];
    const fieldNames = collection.fields.map(f => f.name);
    const missing = requiredFields.filter(name => !fieldNames.includes(name));
    
    if (missing.length > 0) {
      this.addError('collection', `Products collection missing fields: ${missing.join(', ')}`, context);
    }

    // Check for unique constraint on item_key
    const itemKeyField = collection.fields.find(f => f.name === 'item_key');
    if (itemKeyField && !itemKeyField.unique) {
      this.addWarning('collection', 'Products collection item_key should be unique', context);
      
      if (config.fix) {
        this.addFix('collection', 'Set item_key field as unique', () => {
          itemKeyField.unique = true;
        }, context);
      }
    }
  }

  // Validate orders collection
  validateOrdersCollection(collection, context) {
    const requiredFields = ['order_id_text', 'customer_name', 'customer_email', 'total_amount_due_egp'];
    const fieldNames = collection.fields.map(f => f.name);
    const missing = requiredFields.filter(name => !fieldNames.includes(name));
    
    if (missing.length > 0) {
      this.addError('collection', `Orders collection missing fields: ${missing.join(', ')}`, context);
    }
  }

  // Validate settings collection
  validateSettingsCollection(collection, context) {
    const requiredFields = ['xchgRates', 'defCurr', 'servFeeEGP'];
    const fieldNames = collection.fields.map(f => f.name);
    const missing = requiredFields.filter(name => !fieldNames.includes(name));
    
    if (missing.length > 0) {
      this.addError('collection', `Settings collection missing fields: ${missing.join(', ')}`, context);
    }
  }

  // Validate seed data
  validateSeedData() {
    if (!this.seedData) return;

    if (typeof this.seedData !== 'object') {
      this.addError('seed', 'Seed data must be an object');
      return;
    }

    // Validate required sections
    const requiredSections = ['settings', 'products'];
    const foundSections = Object.keys(this.seedData);
    const missing = requiredSections.filter(section => !foundSections.includes(section));
    
    if (missing.length > 0) {
      this.addError('seed', `Missing required seed sections: ${missing.join(', ')}`);
    }

    // Validate each section
    Object.entries(this.seedData).forEach(([section, data]) => {
      this.validateSeedSection(section, data);
    });
  }

  // Validate seed section
  validateSeedSection(section, data) {
    const context = `Seed section: ${section}`;

    if (!Array.isArray(data)) {
      this.addError('seed', `Section must be an array: ${section}`, context);
      return;
    }

    if (data.length === 0) {
      this.addWarning('seed', `Empty section: ${section}`, context);
      return;
    }

    // Validate records based on section type
    data.forEach((record, index) => {
      this.validateSeedRecord(record, section, index);
    });
  }

  // Validate seed record
  validateSeedRecord(record, section, index) {
    const context = `${section}[${index}]`;

    if (typeof record !== 'object' || record === null) {
      this.addError('seed', 'Record must be an object', context);
      return;
    }

    // Section-specific validation
    switch (section) {
      case 'products':
        this.validateProductRecord(record, context);
        break;
      case 'settings':
        this.validateSettingsRecord(record, context);
        break;
    }
  }

  // Validate product record
  validateProductRecord(record, context) {
    const requiredFields = ['item_key', 'product_category', 'variant_name_en', 'base_price_egp'];
    
    requiredFields.forEach(field => {
      if (!record.hasOwnProperty(field) || record[field] === null || record[field] === undefined) {
        this.addError('seed', `Missing required field: ${field}`, context);
      }
    });

    // Validate field types
    if (record.item_key && typeof record.item_key !== 'string') {
      this.addError('seed', 'item_key must be string', context);
    }

    if (record.base_price_egp && (typeof record.base_price_egp !== 'number' || record.base_price_egp < 0)) {
      this.addError('seed', 'base_price_egp must be positive number', context);
    }

    if (record.stock_available_pb && (typeof record.stock_available_pb !== 'number' || record.stock_available_pb < 0)) {
      this.addError('seed', 'stock_available_pb must be non-negative number', context);
    }

    // Validate category
    const validCategories = ['udheya', 'livesheep_general', 'meat_cuts', 'gathering_package', 'breeding_stock', 'feed_supplies'];
    if (record.product_category && !validCategories.includes(record.product_category)) {
      this.addError('seed', `Invalid product_category: ${record.product_category}`, context);
    }
  }

  // Validate settings record
  validateSettingsRecord(record, context) {
    const requiredFields = ['xchgRates', 'defCurr', 'servFeeEGP'];
    
    requiredFields.forEach(field => {
      if (!record.hasOwnProperty(field)) {
        this.addError('seed', `Missing required field: ${field}`, context);
      }
    });

    // Validate exchange rates
    if (record.xchgRates && typeof record.xchgRates === 'object') {
      Object.entries(record.xchgRates).forEach(([currency, data]) => {
        if (!data || typeof data !== 'object') {
          this.addError('seed', `Invalid exchange rate data for ${currency}`, context);
        } else {
          if (typeof data.rate_from_egp !== 'number' || data.rate_from_egp <= 0) {
            this.addError('seed', `Invalid rate_from_egp for ${currency}`, context);
          }
          if (typeof data.is_active !== 'boolean') {
            this.addWarning('seed', `Missing is_active boolean for ${currency}`, context);
          }
        }
      });
    }
  }

  // Lint for best practices and potential issues
  runLinter() {
    if (!this.collections) return;

    this.collections.forEach((collection, index) => {
      this.lintCollection(collection, index);
    });

    this.lintGlobalPatterns();
  }

  // Lint individual collection
  lintCollection(collection, index) {
    const context = `Collection: ${collection.name}`;

    // Check naming conventions
    if (collection.name && !collection.name.match(/^[a-z_]+$/)) {
      this.addWarning('lint', 'Collection name should be lowercase with underscores', context);
    }

    // Check for missing indexes on relations
    if (collection.fields) {
      const relationFields = collection.fields.filter(f => f.type === 'relation' || f.type === 'user');
      relationFields.forEach(field => {
        if (!collection.indexes || !collection.indexes.some(idx => idx.includes(field.name))) {
          this.addInfo('lint', `Consider adding index for relation field: ${field.name}`, context);
        }
      });
    }

    // Check for overly permissive rules
    const rules = ['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule'];
    rules.forEach(rule => {
      if (collection[rule] === '') {
        this.addWarning('lint', `${rule} is empty (allows all access)`, context);
      }
    });

    // Check field naming conventions
    if (collection.fields) {
      collection.fields.forEach(field => {
        if (field.name && !field.name.match(/^[a-z][a-z0-9_]*$/)) {
          this.addWarning('lint', `Field name should be camelCase or snake_case: ${field.name}`, context);
        }
      });
    }
  }

  // Lint global patterns
  lintGlobalPatterns() {
    // Check for missing system collections
    const systemCollections = ['users'];
    const foundNames = this.collections.map(c => c.name);
    
    systemCollections.forEach(name => {
      if (!foundNames.includes(name)) {
        this.addInfo('lint', `Consider adding ${name} collection for user management`);
      }
    });

    // Check for consistent field naming across collections
    const allFields = {};
    this.collections.forEach(collection => {
      if (collection.fields) {
        collection.fields.forEach(field => {
          if (!allFields[field.name]) allFields[field.name] = [];
          allFields[field.name].push({ collection: collection.name, type: field.type });
        });
      }
    });

    // Find fields with same name but different types
    Object.entries(allFields).forEach(([fieldName, occurrences]) => {
      if (occurrences.length > 1) {
        const types = new Set(occurrences.map(o => o.type));
        if (types.size > 1) {
          this.addWarning('lint', `Field '${fieldName}' has inconsistent types across collections: ${Array.from(types).join(', ')}`);
        }
      }
    });
  }

  // Apply automatic fixes
  applyFixes() {
    if (!config.fix && !config.autoFix) return;

    let appliedCount = 0;

    results.fixes.forEach(fix => {
      if (typeof fix.action === 'function') {
        try {
          fix.action();
          fix.applied = true;
          appliedCount++;
        } catch (error) {
          this.addError('fix', `Failed to apply fix: ${error.message}`, fix.context);
        }
      }
    });

    if (appliedCount > 0) {
      this.addInfo('fix', `Applied ${appliedCount} automatic fixes`);
    }
  }

  // Save fixed data
  async saveFixedData() {
    if (!config.fix || !config.outputFile) return;

    try {
      const output = {
        collections: this.fixedData.collections,
        seedData: this.fixedData.seedData,
        fixes: results.fixes.filter(f => f.applied),
        timestamp: new Date().toISOString()
      };

      await fs.writeJson(config.outputFile, output, { spaces: 2 });
      this.addInfo('fix', `Fixed data saved to: ${config.outputFile}`);
    } catch (error) {
      this.addError('fix', `Failed to save fixed data: ${error.message}`);
    }
  }

  // Run all validations
  async validate() {
    const startTime = Date.now();

    // Load files
    if (!(await this.loadFiles())) {
      return results;
    }

    // Run validations based on mode
    if (config.mode === 'all' || config.mode === 'validate') {
      this.validateCollections();
      this.validateSeedData();
    }

    if (config.mode === 'all' || config.mode === 'lint') {
      this.runLinter();
    }

    if (config.mode === 'all' || config.mode === 'fix') {
      this.applyFixes();
      await this.saveFixedData();
    }

    results.stats.processingTime = Date.now() - startTime;
    return results;
  }
}

// Report formatting
class Reporter {
  static formatConsole(results) {
    console.log(chalk.blue('\n🔍 PocketBase Schema Validator Report\n'));
    console.log(chalk.cyan('═'.repeat(60)));
    
    // Stats
    console.log(chalk.white('\n📊 Statistics:'));
    console.log(`   Collections: ${results.stats.totalCollections}`);
    console.log(`   Fields: ${results.stats.totalFields}`);
    console.log(`   Records: ${results.stats.totalRecords}`);
    console.log(`   Processing time: ${results.stats.processingTime}ms`);

    // Errors
    if (results.errors.length > 0) {
      console.log(chalk.red(`\n❌ Errors (${results.errors.length}):`));
      results.errors.forEach(error => {
        console.log(chalk.red(`   • ${error.message}`));
        if (error.context) console.log(chalk.gray(`     ${error.context}`));
      });
    }

    // Warnings
    if (results.warnings.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Warnings (${results.warnings.length}):`));
      results.warnings.forEach(warning => {
        console.log(chalk.yellow(`   • ${warning.message}`));
        if (warning.context) console.log(chalk.gray(`     ${warning.context}`));
      });
    }

    // Info
    if (results.info.length > 0 && config.verbose) {
      console.log(chalk.blue(`\n💡 Info (${results.info.length}):`));
      results.info.forEach(info => {
        console.log(chalk.blue(`   • ${info.message}`));
        if (info.context) console.log(chalk.gray(`     ${info.context}`));
      });
    }

    // Fixes
    if (results.fixes.length > 0) {
      console.log(chalk.green(`\n🔧 Fixes (${results.fixes.length}):`));
      results.fixes.forEach(fix => {
        const status = fix.applied ? chalk.green('✓') : chalk.gray('○');
        console.log(`   ${status} ${fix.message}`);
        if (fix.context) console.log(chalk.gray(`     ${fix.context}`));
      });
    }

    // Summary
    console.log(chalk.cyan('\n═'.repeat(60)));
    
    if (results.errors.length === 0) {
      console.log(chalk.green('✅ No errors found!'));
    } else {
      console.log(chalk.red(`❌ ${results.errors.length} errors need attention`));
    }

    if (results.warnings.length > 0) {
      console.log(chalk.yellow(`⚠️  ${results.warnings.length} warnings to consider`));
    }

    console.log(chalk.cyan('═'.repeat(60)));
  }

  static formatJSON(results) {
    return JSON.stringify(results, null, 2);
  }
}

// CLI help
function showHelp() {
  console.log(chalk.cyan('\n🔍 PocketBase Schema Validator & Linter\n'));
  console.log(chalk.white('Usage: node pb-validator.js [collections.json] [seed.json] [options]\n'));
  
  console.log(chalk.yellow('Arguments:'));
  console.log(chalk.white('  collections.json  Path to collections file (default: ./pb-collections.json)'));
  console.log(chalk.white('  seed.json         Path to seed data file (default: ./pb-seed.json)\n'));
  
  console.log(chalk.yellow('Modes:'));
  console.log(chalk.white('  --validate        Validate schemas against PocketBase API'));
  console.log(chalk.white('  --lint            Check for best practices and patterns'));
  console.log(chalk.white('  --fix             Apply automatic fixes'));
  console.log(chalk.white('  (default)         Run all modes\n'));
  
  console.log(chalk.yellow('Options:'));
  console.log(chalk.white('  --output FILE     Save fixed data to file'));
  console.log(chalk.white('  --auto-fix        Apply fixes automatically'));
  console.log(chalk.white('  --strict          Enable strict validation'));
  console.log(chalk.white('  --verbose         Show detailed info messages'));
  console.log(chalk.white('  --json            Output results as JSON'));
  console.log(chalk.white('  --help            Show this help message\n'));
  
  console.log(chalk.yellow('Examples:'));
  console.log(chalk.white('  node pb-validator.js'));
  console.log(chalk.white('  node pb-validator.js --validate --verbose'));
  console.log(chalk.white('  node pb-validator.js collections.json seed.json --fix --output fixed.json'));
  console.log(chalk.white('  node pb-validator.js --lint --json > report.json\n'));
}

// Main execution
async function main() {
  if (process.argv.includes('--help')) {
    showHelp();
    return;
  }

  try {
    const validator = new PocketBaseValidator();
    const results = await validator.validate();

    if (config.format === 'json') {
      console.log(Reporter.formatJSON(results));
    } else {
      Reporter.formatConsole(results);
    }

    // Exit code based on results
    const exitCode = results.errors.length > 0 ? 1 : 0;
    process.exit(exitCode);

  } catch (error) {
    console.error(chalk.red('\n💥 Fatal error:'), error.message);
    if (config.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Export for module usage
if (require.main === module) {
  main();
}

module.exports = { PocketBaseValidator, Reporter, CONSTRAINTS };