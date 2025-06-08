const fs = require('fs-extra');
const { minify } = require('terser');
const path = require('path');

// Advanced JavaScript minification with Alpine.js preservation
async function minifyJSAdvanced() {
  const inputPath = './public/app.js';
  const outputPath = './public/app.min.js';
  
  try {
    const js = await fs.readFile(inputPath, 'utf8');
    
    // Minify with Terser
    const result = await minify(js, {
      ecma: 2020,
      compress: {
        arguments: true,
        arrows: true,
        booleans_as_integers: false,
        booleans: true,
        collapse_vars: true,
        comparisons: true,
        computed_props: true,
        conditionals: true,
        dead_code: true,
        defaults: true,
        directives: true,
        drop_console: false, // Keep for development, remove in production
        drop_debugger: true,
        evaluate: true,
        expression: false,
        global_defs: {},
        hoist_funs: true,
        hoist_props: true,
        hoist_vars: false,
        if_return: true,
        inline: 3,
        join_vars: true,
        keep_classnames: false,
        keep_fargs: false,
        keep_fnames: false,
        keep_infinity: false,
        loops: true,
        module: false,
        negate_iife: true,
        passes: 3,
        properties: true,
        pure_funcs: null,
        pure_getters: 'strict',
        reduce_funcs: true,
        reduce_vars: true,
        sequences: true,
        side_effects: true,
        switches: true,
        toplevel: false,
        typeofs: true,
        unsafe_arrows: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_symbols: false,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        unused: true,
      },
      mangle: {
        eval: false,
        reserved: [
          // Alpine.js reserved words
          'Alpine',
          '$el',
          '$refs',
          '$root',
          '$store',
          '$dispatch',
          '$nextTick',
          '$watch',
          '$magic',
          'x-data',
          'x-show',
          'x-if',
          'x-for',
          'x-on',
          'x-text',
          'x-html',
          'x-model',
          'x-modelable',
          'x-effect',
          'x-ignore',
          'x-ref',
          'x-cloak',
          'x-teleport',
          'x-transition',
          'x-init',
          // PocketBase
          'PocketBase',
          // App-specific (preserve main data function)
          'sheepLand',
          'businessStats',
          // Preserve API properties that might be accessed externally
          'pb',
          'settings',
          'prodOpts',
          'cartItems',
          'currentPage',
          'currentUser',
          'checkoutForm'
        ],
        properties: {
          regex: /^_/,
          reserved: [
            // Preserve public API properties
            'initApp',
            'navigateToOrScroll',
            'openCart',
            'closeCart',
            'addItemToCart',
            'removeFromCart',
            'updateCartQuantity',
            'calculateCartTotal',
            'placeOrder',
            'loginUser',
            'registerUser',
            'logoutUser'
          ]
        },
        toplevel: false,
        safari10: true
      },
      format: {
        ascii_only: false,
        beautify: false,
        braces: false,
        comments: false,
        ecma: 2020,
        indent_level: 0,
        indent_start: 0,
        inline_script: true,
        keep_numbers: false,
        keep_quoted_props: false,
        max_line_len: false,
        preamble: null,
        preserve_annotations: false,
        quote_keys: false,
        quote_style: 0,
        safari10: true,
        semicolons: true,
        shebang: true,
        shorthand: true,
        source_map: null,
        webkit: false,
        width: 80,
        wrap_iife: false,
        wrap_func_args: false
      },
      parse: {
        bare_returns: false,
        ecma: 2020,
        html5_comments: false,
        shebang: true
      },
      rename: false,
      safari10: true,
      sourceMap: false,
      timings: false,
      toplevel: false,
      warnings: false
    });
    
    if (result.error) {
      console.error('JavaScript minification error:', result.error);
      return;
    }
    
    // Post-process for additional optimizations
    let finalJS = result.code;
    
    // Additional manual optimizations that Terser might miss
    // 1. Shorten common method calls (careful with these)
    finalJS = finalJS.replace(/document\.getElementById/g, 'document.getElementById');
    finalJS = finalJS.replace(/document\.querySelector/g, 'document.querySelector');
    
    // 2. Remove any trailing semicolons before closing braces
    finalJS = finalJS.replace(/;}/g, '}');
    
    // 3. Remove unnecessary parentheses in return statements
    finalJS = finalJS.replace(/return\s*\(([^;]+)\);/g, 'return $1;');
    
    // Write the minified JS
    await fs.writeFile(outputPath, finalJS);
    
    // Calculate statistics
    const originalSize = Buffer.byteLength(js);
    const minifiedSize = Buffer.byteLength(finalJS);
    const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
    
    console.log(`✅ JavaScript Minification Complete!`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
    console.log(`   Reduction: ${reduction}%`);
    
    // Optional: Show warnings if any
    if (result.warnings && result.warnings.length > 0) {
      console.log(`⚠️  Warnings:`);
      result.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
  } catch (error) {
    console.error('Error minifying JavaScript:', error);
  }
}

// Production-specific minification
async function minifyJSProduction() {
  const inputPath = './public/app.js';
  const outputPath = './public/app.min.js';
  
  try {
    const js = await fs.readFile(inputPath, 'utf8');
    
    // Remove console.log statements before minification
    const jsWithoutConsole = js.replace(/console\.(log|debug|info|warn)\([^)]*\);?/g, '');
    
    const result = await minify(jsWithoutConsole, {
      ecma: 2020,
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
        passes: 3,
        unsafe: true,
        unsafe_arrows: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true,
        unused: true,
        dead_code: true,
        conditionals: true,
        comparisons: true,
        evaluate: true,
        booleans: true,
        loops: true,
        toplevel: false,
        hoist_funs: true,
        if_return: true,
        join_vars: true,
        reduce_vars: true,
        collapse_vars: true,
        inline: 3,
        properties: true,
        arguments: true,
        keep_fargs: false
      },
      mangle: {
        safari10: true,
        reserved: ['Alpine', 'PocketBase', 'sheepLand', 'businessStats'],
        properties: false
      },
      format: {
        comments: false,
        safari10: true
      }
    });
    
    await fs.writeFile(outputPath, result.code);
    
    const originalSize = Buffer.byteLength(js);
    const minifiedSize = Buffer.byteLength(result.code);
    const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);
    
    console.log(`✅ JavaScript Production Minification Complete!`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
    console.log(`   Reduction: ${reduction}%`);
    console.log(`   Console statements: Removed`);
    
  } catch (error) {
    console.error('Error in production minification:', error);
  }
}

// Run if called directly
if (require.main === module) {
  const isProduction = process.argv.includes('--production');
  if (isProduction) {
    minifyJSProduction();
  } else {
    minifyJSAdvanced();
  }
}

module.exports = { minifyJSAdvanced, minifyJSProduction };