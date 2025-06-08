const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');

// Combine and optimize vendor files
async function combineVendorFiles() {
  const vendorDir = './public/vendor';
  const outputPath = './public/vendor/vendor.bundle.min.js';
  
  // Define the order of files (important for dependencies)
  const vendorFiles = [
    'alpine.min.js',
    'alpine-collapse.min.js',
    'pocketbase.umd.js'
  ];
  
  try {
    let combinedContent = '';
    let totalOriginalSize = 0;
    
    console.log('📦 Combining vendor files...\n');
    
    for (const file of vendorFiles) {
      const filePath = path.join(vendorDir, file);
      
      if (!await fs.pathExists(filePath)) {
        console.log(`⚠️  Warning: ${file} not found, skipping...`);
        continue;
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      const fileSize = Buffer.byteLength(content);
      totalOriginalSize += fileSize;
      
      // Add IIFE wrapper to prevent global pollution
      combinedContent += `\n/* --- ${file} --- */\n`;
      
      // Don't wrap Alpine.js as it needs to be global
      if (file.includes('alpine')) {
        combinedContent += content;
      } else {
        combinedContent += `(function(){${content}})();`;
      }
      
      combinedContent += '\n';
      
      console.log(`   ✓ ${file} (${(fileSize / 1024).toFixed(2)} KB)`);
    }
    
    // Minify the combined content
    console.log('\n🔧 Minifying combined vendor bundle...');
    
    const minified = await minify(combinedContent, {
      compress: {
        drop_console: false, // Keep console for vendor files
        drop_debugger: true,
        passes: 2,
        pure_funcs: [],
        unused: false, // Don't remove "unused" code from vendor files
        dead_code: false,
        toplevel: false
      },
      mangle: false, // Don't mangle vendor code
      format: {
        comments: false,
        ascii_only: true
      },
      safari10: true
    });
    
    if (minified.error) {
      throw minified.error;
    }
    
    // Write the bundle
    await fs.writeFile(outputPath, minified.code);
    
    const bundleSize = Buffer.byteLength(minified.code);
    const reduction = ((totalOriginalSize - bundleSize) / totalOriginalSize * 100).toFixed(2);
    
    console.log(`\n✅ Vendor Bundle Created!`);
    console.log(`   Original Total: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
    console.log(`   Bundle Size: ${(bundleSize / 1024).toFixed(2)} KB`);
    console.log(`   Reduction: ${reduction}%`);
    console.log(`   Output: ${outputPath}`);
    
    // Create an HTML snippet for easy integration
    const htmlSnippet = `<!-- Optimized vendor bundle -->
<script src="vendor/vendor.bundle.min.js"></script>

<!-- Or use individual files (original approach) -->
<!--
<script src="vendor/alpine.min.js" defer></script>
<script src="vendor/alpine-collapse.min.js" defer></script>
<script src="vendor/pocketbase.umd.js"></script>
-->`;
    
    await fs.writeFile('./public/vendor/integration-snippet.html', htmlSnippet);
    console.log('\n📝 Integration snippet saved to vendor/integration-snippet.html');
    
  } catch (error) {
    console.error('❌ Error combining vendor files:', error);
  }
}

// Create individual minified versions of vendor files
async function minifyIndividualVendorFiles() {
  const vendorDir = './public/vendor';
  const files = await fs.readdir(vendorDir);
  
  console.log('\n🔧 Creating minified versions of individual vendor files...\n');
  
  for (const file of files) {
    if (!file.endsWith('.js') || file.endsWith('.min.js')) {
      continue;
    }
    
    const inputPath = path.join(vendorDir, file);
    const outputPath = path.join(vendorDir, file.replace('.js', '.min.js'));
    
    try {
      const content = await fs.readFile(inputPath, 'utf8');
      const originalSize = Buffer.byteLength(content);
      
      const minified = await minify(content, {
        compress: {
          drop_console: false,
          drop_debugger: true,
          unused: false,
          dead_code: false
        },
        mangle: false,
        format: {
          comments: false
        }
      });
      
      if (minified.error) {
        console.log(`   ❌ Error minifying ${file}: ${minified.error}`);
        continue;
      }
      
      await fs.writeFile(outputPath, minified.code);
      
      const minifiedSize = Buffer.byteLength(minified.code);
      const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
      
      console.log(`   ✓ ${file} → ${path.basename(outputPath)} (-${reduction}%)`);
      
    } catch (error) {
      console.log(`   ❌ Error processing ${file}: ${error.message}`);
    }
  }
}

// Run both operations
async function processVendorFiles() {
  await minifyIndividualVendorFiles();
  await combineVendorFiles();
}

// Run if called directly
if (require.main === module) {
  processVendorFiles();
}

module.exports = { combineVendorFiles, minifyIndividualVendorFiles };