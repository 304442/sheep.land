const https = require('https');

// Fetch app.js from live site
https.get('https://sheep.land/app.js', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('🔍 Validating app.js syntax...\n');
    
    // Check for basic syntax issues
    const openBraces = (data.match(/{/g) || []).length;
    const closeBraces = (data.match(/}/g) || []).length;
    const openParens = (data.match(/\(/g) || []).length;
    const closeParens = (data.match(/\)/g) || []).length;
    const openBrackets = (data.match(/\[/g) || []).length;
    const closeBrackets = (data.match(/\]/g) || []).length;
    
    console.log('Brace balance:');
    console.log(`  { : ${openBraces}`);
    console.log(`  } : ${closeBraces}`);
    console.log(`  Difference: ${openBraces - closeBraces}\n`);
    
    console.log('Parenthesis balance:');
    console.log(`  ( : ${openParens}`);
    console.log(`  ) : ${closeParens}`);
    console.log(`  Difference: ${openParens - closeParens}\n`);
    
    console.log('Bracket balance:');
    console.log(`  [ : ${openBrackets}`);
    console.log(`  ] : ${closeBrackets}`);
    console.log(`  Difference: ${openBrackets - closeBrackets}\n`);
    
    // Try to parse as a module to check syntax
    try {
      new Function(data);
      console.log('✅ JavaScript syntax appears valid');
    } catch (e) {
      console.log('❌ JavaScript syntax error detected:');
      console.log(e.toString());
      
      // Try to find the approximate location
      const match = e.toString().match(/(\d+):(\d+)/);
      if (match) {
        const lineNum = parseInt(match[1]);
        const lines = data.split('\n');
        console.log(`\nError around line ${lineNum}:`);
        for (let i = Math.max(0, lineNum - 3); i < Math.min(lines.length, lineNum + 3); i++) {
          console.log(`${i + 1}: ${lines[i]}`);
        }
      }
    }
    
    // Check Alpine.data call
    const alpineDataMatch = data.match(/Alpine\.data\('sheepLand'/);
    if (alpineDataMatch) {
      console.log('\n✅ Alpine.data registration found');
      
      // Check if it's properly closed
      const alpineInitMatch = data.match(/document\.addEventListener\('alpine:init'[^}]*\}\);/s);
      if (alpineInitMatch) {
        console.log('✅ Alpine init listener appears properly closed');
      } else {
        console.log('⚠️  Alpine init listener might not be properly closed');
      }
    } else {
      console.log('\n❌ Alpine.data registration not found');
    }
  });
}).on('error', (err) => {
  console.error('Error fetching app.js:', err);
});