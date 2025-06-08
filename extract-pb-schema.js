#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

// Simple color functions
const chalk = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`
};

async function extractSchema() {
  try {
    console.log(chalk.blue('🔍 Extracting PocketBase schema from setup.html...'));

    // Read setup.html
    const setupPath = './public/setup.html';
    if (!fs.existsSync(setupPath)) {
      throw new Error('setup.html not found in ./public/');
    }

    const content = await fs.readFile(setupPath, 'utf8');

    // Extract collections definition
    const collectionsMatch = content.match(/const collectionsDefinition = (\[[\s\S]*?\]);/);
    if (!collectionsMatch) {
      throw new Error('Could not find collectionsDefinition in setup.html');
    }

    // Extract seed data
    const seedMatch = content.match(/const seedData = (\{[\s\S]*?\});/);
    if (!seedMatch) {
      throw new Error('Could not find seedData in setup.html');
    }

    // Parse the extracted JavaScript
    const collectionsCode = collectionsMatch[1];
    const seedCode = seedMatch[1];

    // Clean up the code for safe evaluation
    let cleanCollectionsCode = collectionsCode;
    let cleanSeedCode = seedCode;
    
    // Replace template literals and fix any issues
    cleanSeedCode = cleanSeedCode.replace(/new Date\([^)]+\)\.toISOString\(\)/g, '"2024-12-31T23:59:59.999Z"');
    
    // Extract and define defaultRefundPolicyHTML
    const refundPolicyMatch = content.match(/const defaultRefundPolicyHTML = `([\s\S]*?)`;/);
    let defaultRefundPolicyHTML = '';
    if (refundPolicyMatch) {
      defaultRefundPolicyHTML = refundPolicyMatch[1];
    }
    
    // Replace references to defaultRefundPolicyHTML with the actual content
    cleanSeedCode = cleanSeedCode.replace(/defaultRefundPolicyHTML/g, JSON.stringify(defaultRefundPolicyHTML));
    
    // Try to parse as JSON-like structure
    let collections, seed;
    
    try {
      collections = eval('(' + cleanCollectionsCode + ')');
      seed = eval('(' + cleanSeedCode + ')');
    } catch (evalError) {
      // If eval fails, try a more robust approach
      console.log(chalk.yellow('⚠️ Direct eval failed, using fallback method...'));
      
      // Write to temporary files and require them
      const tempCollections = './temp-collections.js';
      const tempSeed = './temp-seed.js';
      
      await fs.writeFile(tempCollections, `module.exports = ${cleanCollectionsCode};`);
      await fs.writeFile(tempSeed, `module.exports = ${cleanSeedCode};`);
      
      delete require.cache[path.resolve(tempCollections)];
      delete require.cache[path.resolve(tempSeed)];
      
      collections = require(tempCollections);
      seed = require(tempSeed);
      
      // Clean up temp files
      await fs.remove(tempCollections);
      await fs.remove(tempSeed);
    }

    // Write collections to JSON file
    await fs.writeJson('./pb-collections.json', collections, { spaces: 2 });
    console.log(chalk.green('✅ Collections extracted to: pb-collections.json'));

    // Write seed data to JSON file
    await fs.writeJson('./pb-seed.json', seed, { spaces: 2 });
    console.log(chalk.green('✅ Seed data extracted to: pb-seed.json'));

    console.log(chalk.blue('\n📊 Extraction Summary:'));
    console.log(`   Collections: ${collections.length}`);
    console.log(`   Seed sections: ${Object.keys(seed).length}`);
    
    if (seed.products) {
      console.log(`   Products: ${seed.products.length}`);
    }

    console.log(chalk.yellow('\n🔧 Next steps:'));
    console.log('   npm run pb:validate  # Validate schema');
    console.log('   npm run pb:lint      # Check best practices');
    console.log('   npm run pb:fix       # Apply fixes');
    console.log('   npm run pb:all       # Run everything');

  } catch (error) {
    console.error(chalk.red('❌ Extraction failed:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  extractSchema();
}

module.exports = { extractSchema };