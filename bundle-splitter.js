const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

// Simple color functions for console output
const chalk = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  white: (text) => `\x1b[37m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// Configuration
const config = {
  bundleFile: process.argv[2] || './sheep-land-bundle.html',
  outputDir: process.argv[3] || './split-output',
  preserveStructure: !process.argv.includes('--flatten'),
  createIndex: !process.argv.includes('--no-index'),
  beautify: process.argv.includes('--beautify'),
  stats: {
    originalSize: 0,
    htmlSize: 0,
    cssSize: 0,
    jsSize: 0,
    assetsExtracted: 0
  }
};

// Helper functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function beautifyCode(code, type) {
  if (!config.beautify) return code;
  
  switch (type) {
    case 'css':
      return code
        .replace(/\{/g, ' {\n  ')
        .replace(/;/g, ';\n  ')
        .replace(/\}/g, '\n}\n')
        .replace(/,/g, ',\n')
        .replace(/\n\s*\n/g, '\n');
        
    case 'js':
      return code
        .replace(/\{/g, ' {\n  ')
        .replace(/;/g, ';\n  ')
        .replace(/\}/g, '\n}\n')
        .replace(/,/g, ', ')
        .replace(/\n\s*\n/g, '\n');
        
    case 'html':
      return code
        .replace(/></g, '>\n<')
        .split('\n')
        .map((line, index) => {
          const depth = (line.match(/</g) || []).length - (line.match(/\//g) || []).length;
          return '  '.repeat(Math.max(0, depth)) + line.trim();
        })
        .join('\n');
        
    default:
      return code;
  }
}

function generateFileName(type, index = '') {
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '').substring(0, 15);
  const suffix = index ? `-${index}` : '';
  
  switch (type) {
    case 'css':
      return `styles${suffix}-${timestamp}.css`;
    case 'js':
      return `script${suffix}-${timestamp}.js`;
    case 'html':
      return 'index.html';
    default:
      return `asset${suffix}-${timestamp}.${type}`;
  }
}

// Bundle splitting function
async function splitBundle() {
  const startTime = Date.now();
  
  console.log(chalk.blue('\n🔧 Bundle Splitter Tool\n'));
  console.log(chalk.cyan('═'.repeat(50)));
  
  try {
    // Check if bundle file exists
    if (!fs.existsSync(config.bundleFile)) {
      throw new Error(`Bundle file not found: ${config.bundleFile}`);
    }
    
    // Read bundle content
    const bundleContent = await fs.readFile(config.bundleFile, 'utf8');
    config.stats.originalSize = Buffer.byteLength(bundleContent);
    
    console.log(chalk.white(`${chalk.bold('Input Bundle:')} ${config.bundleFile}`));
    console.log(chalk.white(`${chalk.bold('Bundle Size:')} ${formatBytes(config.stats.originalSize)}`));
    console.log(chalk.white(`${chalk.bold('Output Directory:')} ${config.outputDir}`));
    console.log(chalk.white(`${chalk.bold('Beautify Code:')} ${config.beautify ? chalk.green('Yes') : chalk.gray('No')}`));
    
    console.log(chalk.cyan('═'.repeat(50)));
    
    // Create output directory
    await fs.ensureDir(config.outputDir);
    
    // Parse HTML with cheerio
    const $ = cheerio.load(bundleContent);
    
    let cssFiles = [];
    let jsFiles = [];
    let extractedAssets = 0;
    
    console.log(chalk.blue('\n📦 Extracting Assets...\n'));
    
    // Extract inline CSS
    const styleElements = $('style');
    if (styleElements.length > 0) {
      console.log(chalk.yellow(`Found ${styleElements.length} inline style block(s)`));
      
      styleElements.each((index, element) => {
        const cssContent = $(element).html();
        if (cssContent && cssContent.trim()) {
          const fileName = generateFileName('css', styleElements.length > 1 ? index + 1 : '');
          const filePath = path.join(config.outputDir, fileName);
          const beautifiedCSS = beautifyCode(cssContent, 'css');
          
          fs.writeFileSync(filePath, beautifiedCSS);
          config.stats.cssSize += Buffer.byteLength(beautifiedCSS);
          cssFiles.push(fileName);
          extractedAssets++;
          
          console.log(chalk.green(`✓ Extracted CSS: ${fileName} (${formatBytes(Buffer.byteLength(beautifiedCSS))})`));
          
          // Replace inline style with link
          $(element).replaceWith(`<link rel="stylesheet" href="${fileName}">`);
        }
      });
    }
    
    // Extract inline JavaScript
    const scriptElements = $('script:not([src])');
    if (scriptElements.length > 0) {
      console.log(chalk.yellow(`Found ${scriptElements.length} inline script block(s)`));
      
      scriptElements.each((index, element) => {
        const jsContent = $(element).html();
        if (jsContent && jsContent.trim()) {
          const fileName = generateFileName('js', scriptElements.length > 1 ? index + 1 : '');
          const filePath = path.join(config.outputDir, fileName);
          const beautifiedJS = beautifyCode(jsContent, 'js');
          
          fs.writeFileSync(filePath, beautifiedJS);
          config.stats.jsSize += Buffer.byteLength(beautifiedJS);
          jsFiles.push(fileName);
          extractedAssets++;
          
          console.log(chalk.green(`✓ Extracted JS: ${fileName} (${formatBytes(Buffer.byteLength(beautifiedJS))})`));
          
          // Replace inline script with external reference
          $(element).replaceWith(`<script src="${fileName}"></script>`);
        }
      });
    }
    
    // Extract other inline assets (base64 images, etc.)
    const imgElements = $('img[src^="data:"]');
    if (imgElements.length > 0) {
      console.log(chalk.yellow(`Found ${imgElements.length} inline image(s)`));
      
      imgElements.each((index, element) => {
        const src = $(element).attr('src');
        if (src && src.startsWith('data:')) {
          try {
            // Parse data URL
            const matches = src.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              const mimeType = matches[1];
              const base64Data = matches[2];
              const extension = mimeType.split('/')[1] || 'bin';
              const fileName = `image-${index + 1}.${extension}`;
              const filePath = path.join(config.outputDir, fileName);
              
              // Write binary file
              fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
              
              const fileSize = fs.statSync(filePath).size;
              extractedAssets++;
              
              console.log(chalk.green(`✓ Extracted Image: ${fileName} (${formatBytes(fileSize)})`));
              
              // Update src attribute
              $(element).attr('src', fileName);
            }
          } catch (error) {
            console.log(chalk.red(`❌ Failed to extract image ${index + 1}: ${error.message}`));
          }
        }
      });
    }
    
    // Generate final HTML
    const finalHtml = beautifyCode($.html(), 'html');
    config.stats.htmlSize = Buffer.byteLength(finalHtml);
    
    if (config.createIndex) {
      const htmlPath = path.join(config.outputDir, 'index.html');
      await fs.writeFile(htmlPath, finalHtml);
      console.log(chalk.green(`✓ Generated HTML: index.html (${formatBytes(config.stats.htmlSize)})`));
    }
    
    config.stats.assetsExtracted = extractedAssets;
    
    // Create manifest file
    const manifest = {
      generated: new Date().toISOString(),
      source: path.basename(config.bundleFile),
      assets: {
        html: config.createIndex ? ['index.html'] : [],
        css: cssFiles,
        js: jsFiles,
        images: imgElements.length > 0 ? 
          Array.from({ length: imgElements.length }, (_, i) => `image-${i + 1}.*`) : []
      },
      stats: config.stats
    };
    
    const manifestPath = path.join(config.outputDir, 'manifest.json');
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    console.log(chalk.blue(`✓ Generated manifest: manifest.json`));
    
    // Display statistics
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(chalk.blue('\n📊 Split Statistics:\n'));
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.white(`${chalk.bold('Processing Time:')} ${processingTime}s`));
    console.log(chalk.white(`${chalk.bold('Assets Extracted:')} ${config.stats.assetsExtracted}`));
    console.log(chalk.white(`${chalk.bold('Original Bundle:')} ${formatBytes(config.stats.originalSize)}`));
    
    const totalSplitSize = config.stats.htmlSize + config.stats.cssSize + config.stats.jsSize;
    console.log(chalk.white(`${chalk.bold('Split Total:')} ${formatBytes(totalSplitSize)}`));
    
    if (totalSplitSize > config.stats.originalSize) {
      const overhead = totalSplitSize - config.stats.originalSize;
      console.log(chalk.yellow(`${chalk.bold('Split Overhead:')} +${formatBytes(overhead)} (+${((overhead / config.stats.originalSize) * 100).toFixed(2)}%)`));
    }
    
    console.log(chalk.blue('\n📋 File Breakdown:\n'));
    if (config.stats.htmlSize > 0) {
      console.log(chalk.white(`HTML: ${formatBytes(config.stats.htmlSize)}`));
    }
    if (config.stats.cssSize > 0) {
      console.log(chalk.white(`CSS: ${formatBytes(config.stats.cssSize)} (${cssFiles.length} file${cssFiles.length !== 1 ? 's' : ''})`));
    }
    if (config.stats.jsSize > 0) {
      console.log(chalk.white(`JavaScript: ${formatBytes(config.stats.jsSize)} (${jsFiles.length} file${jsFiles.length !== 1 ? 's' : ''})`));
    }
    
    console.log(chalk.blue('\n🚀 Benefits of Splitting:\n'));
    const benefits = [
      '✓ Separate caching for each asset type',
      '✓ Parallel downloading of resources',
      '✓ Better debugging capabilities',
      '✓ Easier maintenance and updates',
      '✓ Selective loading of assets',
      '✓ Improved development workflow'
    ];
    
    benefits.forEach(benefit => console.log(chalk.green(benefit)));
    
    console.log(chalk.green(`\n✨ Bundle successfully split into ${config.outputDir}/\n`));
    
    // Show next steps
    console.log(chalk.blue('🔄 Next Steps:\n'));
    console.log(chalk.white(`1. Review generated files in: ${config.outputDir}/`));
    console.log(chalk.white(`2. Test the split version: open ${path.join(config.outputDir, 'index.html')}`));
    console.log(chalk.white(`3. Deploy individual files for optimal caching`));
    console.log(chalk.white(`4. Consider implementing HTTP/2 push for critical resources\n`));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Bundle splitting failed:'), error.message);
    if (process.argv.includes('--verbose')) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// CLI help
function showHelp() {
  console.log(chalk.cyan('\n🔧 Bundle Splitter Tool\n'));
  console.log(chalk.white('Splits a bundled HTML file back into separate CSS, JS, and HTML files\n'));
  console.log(chalk.white('Usage: node bundle-splitter.js [bundle-file] [output-dir] [options]\n'));
  
  console.log(chalk.yellow('Arguments:'));
  console.log(chalk.white('  bundle-file     Path to the bundle file (default: ./sheep-land-bundle.html)'));
  console.log(chalk.white('  output-dir      Output directory (default: ./split-output)\n'));
  
  console.log(chalk.yellow('Options:'));
  console.log(chalk.white('  --beautify     Beautify extracted code (add formatting)'));
  console.log(chalk.white('  --flatten      Put all files in root (no subdirectories)'));
  console.log(chalk.white('  --no-index     Don\'t generate index.html'));
  console.log(chalk.white('  --verbose      Show detailed error information'));
  console.log(chalk.white('  --help         Show this help message\n'));
  
  console.log(chalk.yellow('Examples:'));
  console.log(chalk.white('  node bundle-splitter.js'));
  console.log(chalk.white('  node bundle-splitter.js my-bundle.html ./output'));
  console.log(chalk.white('  node bundle-splitter.js --beautify --no-index'));
  console.log(chalk.white('  node bundle-splitter.js sheep-land-bundle.html ./www --beautify\n'));
}

// Main execution
if (require.main === module) {
  if (process.argv.includes('--help')) {
    showHelp();
  } else {
    splitBundle().catch(error => {
      console.error(chalk.red('Fatal error:'), error.message);
      process.exit(1);
    });
  }
}

module.exports = { splitBundle, config };