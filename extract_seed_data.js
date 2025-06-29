#!/usr/bin/env node

/**
 * Extract seed data from setup.html for migration to proper data files
 * This script parses the setup.html file and extracts the embedded seed data
 * 
 * Usage: node extract_seed_data.js
 * Output: Creates JSON files with extracted seed data
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Extracting seed data from setup.html...');

try {
    const setupHtmlPath = path.join(__dirname, 'public', 'setup.html');
    const setupContent = fs.readFileSync(setupHtmlPath, 'utf8');
    
    // Extract the seedData object from the JavaScript in setup.html
    // This is a simplified extraction - in practice you might need more sophisticated parsing
    
    const seedDataMatch = setupContent.match(/const\s+seedData\s*=\s*({[\s\S]*?});/);
    
    if (seedDataMatch) {
        console.log('✅ Found seed data in setup.html');
        
        // Create a temp JS file to evaluate the object
        const tempJs = `
            const seedData = ${seedDataMatch[1]};
            console.log(JSON.stringify(seedData, null, 2));
        `;
        
        fs.writeFileSync('temp_extract.js', tempJs);
        
        console.log('📁 Created temp_extract.js');
        console.log('🔄 To extract seed data, run: node temp_extract.js > seed_data.json');
        console.log('🧹 Then delete temp_extract.js');
        
    } else {
        console.log('❌ Could not find seed data pattern in setup.html');
        console.log('ℹ️  Manual extraction may be required');
    }
    
    // Look for other data patterns
    const productsMatch = setupContent.match(/products:\s*\[[\s\S]*?\]/);
    const settingsMatch = setupContent.match(/settings:\s*\[[\s\S]*?\]/);
    
    if (productsMatch) {
        console.log('📦 Found products data');
    }
    
    if (settingsMatch) {
        console.log('⚙️  Found settings data');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Extract the seed data to JSON files');
    console.log('2. Create data migration files');
    console.log('3. Test migrations in development');
    console.log('4. Remove setup.html after verification');
    
} catch (error) {
    console.error('❌ Error reading setup.html:', error.message);
    console.log('ℹ️  Make sure setup.html exists in public/ directory');
}

console.log('\n🎯 Goal: Replace manual setup.html with automated migrations');
console.log('📖 See MIGRATION_FROM_SETUP.md for detailed migration guide');