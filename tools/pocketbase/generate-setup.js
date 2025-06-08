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

async function generateSetupHtml() {
  try {
    console.log(chalk.blue('🏗️ Generating setup.html from schema files...'));

    // Load schema modules
    const { collectionsDefinition } = require('./collections-schema.js');
    const { seedData, defaultRefundPolicyHTML } = require('./seed-data.js');

    // Read the current setup.html to preserve the HTML structure
    const setupPath = path.resolve(__dirname, '../../public/setup.html');
    if (!fs.existsSync(setupPath)) {
      throw new Error('Original setup.html not found');
    }

    let setupContent = await fs.readFile(setupPath, 'utf8');

    // Find the start and end of the schema definitions
    const collectionsStart = setupContent.indexOf('const collectionsDefinition = [');
    const seedDataStart = setupContent.indexOf('const seedData = {');
    const seedDataEnd = setupContent.indexOf('};', seedDataStart) + 2;

    if (collectionsStart === -1 || seedDataStart === -1) {
      throw new Error('Could not find schema definitions in setup.html');
    }

    // Find the end of collections definition
    let collectionsEnd = setupContent.indexOf('];', collectionsStart) + 2;

    // Also find and replace the defaultRefundPolicyHTML definition
    const refundPolicyStart = setupContent.indexOf('const defaultRefundPolicyHTML = `');
    let refundPolicyEnd = -1;
    if (refundPolicyStart !== -1) {
      refundPolicyEnd = setupContent.indexOf('`;', refundPolicyStart) + 2;
    }

    // Generate the new schema JavaScript code
    const collectionsCode = `const collectionsDefinition = ${JSON.stringify(collectionsDefinition, null, 8)};`;
    
    // Generate seed data code with function call for dynamic date
    const seedDataCode = `const seedData = ${JSON.stringify(seedData, null, 8).replace(
      /"promoEndISO": ".*?"/,
      '"promoEndISO": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()'
    )};`;

    const refundPolicyCode = `const defaultRefundPolicyHTML = \`${defaultRefundPolicyHTML}\`;`;

    // Replace the schema definitions
    let newContent = setupContent;

    // Replace in reverse order to maintain correct positions
    if (refundPolicyStart !== -1 && refundPolicyEnd !== -1) {
      newContent = newContent.substring(0, refundPolicyStart) + 
                   refundPolicyCode + 
                   newContent.substring(refundPolicyEnd);
    }

    // Recalculate positions after first replacement
    const newCollectionsStart = newContent.indexOf('const collectionsDefinition = [');
    const newSeedDataStart = newContent.indexOf('const seedData = {');
    const newSeedDataEnd = newContent.indexOf('};', newSeedDataStart) + 2;
    const newCollectionsEnd = newContent.indexOf('];', newCollectionsStart) + 2;

    // Replace seedData first (later in file)
    newContent = newContent.substring(0, newSeedDataStart) + 
                 seedDataCode + 
                 newContent.substring(newSeedDataEnd);

    // Recalculate collections position after seedData replacement
    const finalCollectionsStart = newContent.indexOf('const collectionsDefinition = [');
    const finalCollectionsEnd = newContent.indexOf('];', finalCollectionsStart) + 2;

    // Replace collections
    newContent = newContent.substring(0, finalCollectionsStart) + 
                 collectionsCode + 
                 newContent.substring(finalCollectionsEnd);

    // Write the new setup.html
    await fs.writeFile(setupPath, newContent, 'utf8');
    
    console.log(chalk.green('✅ setup.html generated successfully'));
    console.log(chalk.blue('\n📊 Generation Summary:'));
    console.log(`   Collections: ${collectionsDefinition.length}`);
    console.log(`   Seed sections: ${Object.keys(seedData).length}`);
    if (seedData.products) {
      console.log(`   Products: ${seedData.products.length}`);
    }

    console.log(chalk.yellow('\n🔧 Schema is now managed in tools/pocketbase/:'));
    console.log('   collections-schema.js  - Collection definitions');
    console.log('   seed-data.js          - Seed data');
    console.log('   generate-setup.js     - This generator tool');
    console.log('\n   Edit schema files, then run npm run setup:generate');

  } catch (error) {
    console.error(chalk.red('❌ Generation failed:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateSetupHtml();
}

module.exports = { generateSetupHtml };