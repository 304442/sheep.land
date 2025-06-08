const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Test minified files for common issues
async function testMinifiedFiles() {
  console.log('🧪 Testing Minified Files\n');
  
  const tests = {
    passed: 0,
    failed: 0,
    warnings: 0
  };
  
  // Test 1: Check if minified files exist
  console.log('📁 Checking minified files exist...');
  const requiredFiles = [
    './public/styles.min.css',
    './public/app.min.js',
    './public/index.min.html'
  ];
  
  for (const file of requiredFiles) {
    if (await fs.pathExists(file)) {
      console.log(`   ✅ ${path.basename(file)} exists`);
      tests.passed++;
    } else {
      console.log(`   ❌ ${path.basename(file)} missing`);
      tests.failed++;
    }
  }
  
  // Test 2: Check file sizes
  console.log('\n📏 Checking file size reductions...');
  const filePairs = [
    ['./public/styles.css', './public/styles.min.css'],
    ['./public/app.js', './public/app.min.js'],
    ['./public/index.html', './public/index.min.html']
  ];
  
  for (const [original, minified] of filePairs) {
    if (await fs.pathExists(original) && await fs.pathExists(minified)) {
      const origSize = (await fs.stat(original)).size;
      const minSize = (await fs.stat(minified)).size;
      const reduction = ((origSize - minSize) / origSize * 100).toFixed(2);
      
      if (minSize < origSize) {
        console.log(`   ✅ ${path.basename(original)} reduced by ${reduction}%`);
        tests.passed++;
      } else {
        console.log(`   ❌ ${path.basename(original)} not reduced`);
        tests.failed++;
      }
    }
  }
  
  // Test 3: Check Alpine.js attributes preserved
  console.log('\n🏔️  Checking Alpine.js preservation...');
  if (await fs.pathExists('./public/index.min.html')) {
    const minifiedHTML = await fs.readFile('./public/index.min.html', 'utf8');
    const alpineAttributes = ['x-data', 'x-show', 'x-if', 'x-for', 'x-on', '@click'];
    
    for (const attr of alpineAttributes) {
      if (minifiedHTML.includes(attr)) {
        console.log(`   ✅ ${attr} preserved`);
        tests.passed++;
      } else {
        console.log(`   ⚠️  ${attr} might be missing`);
        tests.warnings++;
      }
    }
  }
  
  // Test 4: Check JavaScript syntax
  console.log('\n🔧 Checking JavaScript syntax...');
  if (await fs.pathExists('./public/app.min.js')) {
    try {
      const minifiedJS = await fs.readFile('./public/app.min.js', 'utf8');
      
      // Basic syntax check
      new Function(minifiedJS);
      console.log('   ✅ JavaScript syntax valid');
      tests.passed++;
      
      // Check for important functions
      const importantFunctions = ['Alpine.data', 'sheepLand', 'initApp', 'PocketBase'];
      for (const func of importantFunctions) {
        if (minifiedJS.includes(func)) {
          console.log(`   ✅ ${func} found`);
          tests.passed++;
        } else {
          console.log(`   ❌ ${func} missing`);
          tests.failed++;
        }
      }
    } catch (error) {
      console.log(`   ❌ JavaScript syntax error: ${error.message}`);
      tests.failed++;
    }
  }
  
  // Test 5: Check CSS syntax
  console.log('\n🎨 Checking CSS validity...');
  if (await fs.pathExists('./public/styles.min.css')) {
    const minifiedCSS = await fs.readFile('./public/styles.min.css', 'utf8');
    
    // Basic checks
    const checks = [
      { name: 'Has :root variables', test: minifiedCSS.includes(':root{') },
      { name: 'Has body styles', test: minifiedCSS.includes('body{') },
      { name: 'Has button styles', test: minifiedCSS.includes('.btn') },
      { name: 'Proper closing braces', test: (minifiedCSS.match(/{/g) || []).length === (minifiedCSS.match(/}/g) || []).length }
    ];
    
    for (const check of checks) {
      if (check.test) {
        console.log(`   ✅ ${check.name}`);
        tests.passed++;
      } else {
        console.log(`   ❌ ${check.name}`);
        tests.failed++;
      }
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${tests.passed}`);
  console.log(`   ❌ Failed: ${tests.failed}`);
  console.log(`   ⚠️  Warnings: ${tests.warnings}`);
  
  if (tests.failed === 0) {
    console.log('\n🎉 All tests passed! Minified files appear to be valid.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the minified files.');
  }
  
  // Create a test HTML file that uses minified assets
  if (tests.failed === 0) {
    console.log('\n📝 Creating test HTML with minified assets...');
    
    const testHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Sheep Land - Minified Test</title>
    <link rel="stylesheet" href="styles.min.css">
    <style>[x-cloak]{display:none!important}</style>
</head>
<body x-data="sheepLand" x-init="initApp()" x-cloak>
    <div class="test-banner" style="background:#4CAF50;color:white;padding:10px;text-align:center;">
        ✅ This page is using minified assets
    </div>
    
    <!-- Include your main content here -->
    <div x-show="!load.init" style="padding:20px;">
        <h1>Minified Version Test</h1>
        <p>If you can see this and Alpine.js is working, the minification was successful!</p>
        <button @click="alert('Alpine.js is working!')" class="btn bp">Test Alpine.js</button>
    </div>
    
    <script src="vendor/alpine.min.js" defer></script>
    <script src="vendor/alpine-collapse.min.js" defer></script>
    <script src="vendor/pocketbase.umd.js"></script>
    <script src="app.min.js"></script>
</body>
</html>`;
    
    await fs.writeFile('./public/test-minified.html', testHTML);
    console.log('   ✅ Created test-minified.html');
    console.log('   📌 Open this file in a browser to test the minified version');
  }
}

// Run if called directly
if (require.main === module) {
  testMinifiedFiles();
}

module.exports = testMinifiedFiles;