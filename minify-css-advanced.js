const fs = require('fs-extra');
const CleanCSS = require('clean-css');
const path = require('path');

// Advanced CSS minification with custom optimizations
async function minifyCSSAdvanced() {
  const inputPath = './public/styles.css';
  const outputPath = './public/styles.min.css';
  
  try {
    const css = await fs.readFile(inputPath, 'utf8');
    
    // Pre-process CSS for additional optimizations
    let optimizedCSS = css;
    
    // 1. Combine color values
    optimizedCSS = optimizedCSS.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g, '#$1$2$3');
    
    // 2. Remove unnecessary zeros
    optimizedCSS = optimizedCSS.replace(/\b0\.(\d+)/g, '.$1');
    optimizedCSS = optimizedCSS.replace(/(\s|:)0px/g, '$10');
    optimizedCSS = optimizedCSS.replace(/(\s|:)0em/g, '$10');
    optimizedCSS = optimizedCSS.replace(/(\s|:)0rem/g, '$10');
    
    // 3. Shorten common values
    optimizedCSS = optimizedCSS.replace(/margin:\s*0\s+0\s+0\s+0/g, 'margin:0');
    optimizedCSS = optimizedCSS.replace(/padding:\s*0\s+0\s+0\s+0/g, 'padding:0');
    optimizedCSS = optimizedCSS.replace(/margin:\s*(\S+)\s+\1\s+\1\s+\1/g, 'margin:$1');
    optimizedCSS = optimizedCSS.replace(/padding:\s*(\S+)\s+\1\s+\1\s+\1/g, 'padding:$1');
    optimizedCSS = optimizedCSS.replace(/margin:\s*(\S+)\s+(\S+)\s+\1\s+\2/g, 'margin:$1 $2');
    optimizedCSS = optimizedCSS.replace(/padding:\s*(\S+)\s+(\S+)\s+\1\s+\2/g, 'padding:$1 $2');
    
    // Use Clean-CSS with aggressive settings
    const output = new CleanCSS({
      level: {
        1: {
          all: true,
          cleanupCharsets: true,
          normalizeUrls: true,
          optimizeBackground: true,
          optimizeBorderRadius: true,
          optimizeFilter: true,
          optimizeFont: true,
          optimizeFontWeight: true,
          optimizeOutline: true,
          removeEmpty: true,
          removeNegativePaddings: true,
          removeQuotes: true,
          removeWhitespace: true,
          replaceMultipleZeros: true,
          replaceTimeUnits: true,
          replaceZeroUnits: true,
          roundingPrecision: false,
          selectorsSortingMethod: 'standard',
          specialComments: 0,
          tidyAtRules: true,
          tidyBlockScopes: true,
          tidySelectors: true,
          transform: function (propertyName, propertyValue) {
            // Custom transforms
            if (propertyName === 'font-weight' && propertyValue === 'normal') {
              return '400';
            }
            if (propertyName === 'font-weight' && propertyValue === 'bold') {
              return '700';
            }
            return propertyValue;
          }
        },
        2: {
          mergeAdjacentRules: true,
          mergeIntoShorthands: true,
          mergeMedia: true,
          mergeNonAdjacentRules: true,
          mergeSemantically: false,
          overrideProperties: true,
          removeEmpty: true,
          reduceNonAdjacentRules: true,
          removeDuplicateFontRules: true,
          removeDuplicateMediaBlocks: true,
          removeDuplicateRules: true,
          removeUnusedAtRules: false,
          restructureRules: false
        }
      },
      format: {
        breaks: {
          afterAtRule: false,
          afterBlockBegins: false,
          afterBlockEnds: false,
          afterComment: false,
          afterProperty: false,
          afterRuleBegins: false,
          afterRuleEnds: false,
          beforeBlockEnds: false,
          betweenSelectors: false
        },
        indentBy: 0,
        indentWith: '',
        spaces: {
          aroundSelectorRelation: false,
          beforeBlockBegins: false,
          beforeValue: false
        },
        wrapAt: false
      }
    }).minify(optimizedCSS);
    
    if (output.errors.length > 0) {
      console.error('CSS minification errors:', output.errors);
      return;
    }
    
    // Post-process for additional size savings
    let finalCSS = output.styles;
    
    // Remove any remaining whitespace around operators
    finalCSS = finalCSS.replace(/\s*([>+~,])\s*/g, '$1');
    
    // Write the minified CSS
    await fs.writeFile(outputPath, finalCSS);
    
    // Calculate statistics
    const originalSize = Buffer.byteLength(css);
    const minifiedSize = Buffer.byteLength(finalCSS);
    const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
    
    console.log(`✅ CSS Minification Complete!`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
    console.log(`   Reduction: ${reduction}%`);
    
  } catch (error) {
    console.error('Error minifying CSS:', error);
  }
}

// Run if called directly
if (require.main === module) {
  minifyCSSAdvanced();
}

module.exports = minifyCSSAdvanced;