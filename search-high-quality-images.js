const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp'); // For image analysis

// Remaining images to search with quality requirements
const remainingImages = [
  {
    filename: 'sheep-black.jpg',
    searches: [
      { engine: 'unsplash', query: 'black sheep' },
      { engine: 'pexels', query: 'black sheep wool' },
      { engine: 'pixabay', query: 'black sheep animal' },
      { engine: 'bing', query: 'black sheep farm animal no watermark' }
    ],
    minWidth: 1200,
    minHeight: 800
  },
  {
    filename: 'sheep-white.jpg',
    searches: [
      { engine: 'unsplash', query: 'white sheep' },
      { engine: 'pexels', query: 'white sheep wool' },
      { engine: 'pixabay', query: 'white sheep clean' },
      { engine: 'bing', query: 'white sheep merino high resolution' }
    ],
    minWidth: 1200,
    minHeight: 800
  },
  {
    filename: 'sheep-imported.jpg',
    searches: [
      { engine: 'unsplash', query: 'sheep livestock' },
      { engine: 'pexels', query: 'premium sheep breed' },
      { engine: 'pixabay', query: 'sheep farm quality' }
    ],
    minWidth: 1200,
    minHeight: 800
  },
  {
    filename: 'lamb-shoulder.jpg',
    searches: [
      { engine: 'unsplash', query: 'raw meat' },
      { engine: 'pexels', query: 'lamb shoulder meat' },
      { engine: 'pixabay', query: 'raw lamb shoulder' },
      { engine: 'stockfood', query: 'lamb shoulder raw' }
    ],
    minWidth: 1200,
    minHeight: 800
  },
  {
    filename: 'lamb-cuts.jpg',
    searches: [
      { engine: 'unsplash', query: 'meat cubes raw' },
      { engine: 'pexels', query: 'diced lamb meat' },
      { engine: 'pixabay', query: 'stew meat cubes' }
    ],
    minWidth: 1200,
    minHeight: 800
  },
  {
    filename: 'meat-steak.jpg',
    searches: [
      { engine: 'unsplash', query: 'steak raw meat' },
      { engine: 'pexels', query: 'lamb steak raw' },
      { engine: 'pixabay', query: 'premium steak meat' }
    ],
    minWidth: 1200,
    minHeight: 800
  },
  {
    filename: 'sheep-field.jpg',
    searches: [
      { engine: 'unsplash', query: 'sheep grazing field' },
      { engine: 'pexels', query: 'sheep pasture landscape' },
      { engine: 'pixabay', query: 'sheep field nature' }
    ],
    minWidth: 1600,
    minHeight: 1200
  },
  {
    filename: 'sheep-flock.jpg',
    searches: [
      { engine: 'unsplash', query: 'sheep flock herd' },
      { engine: 'pexels', query: 'sheep group pasture' },
      { engine: 'pixabay', query: 'flock of sheep' }
    ],
    minWidth: 1600,
    minHeight: 1200
  },
  {
    filename: 'udheya-standard.jpg',
    searches: [
      { engine: 'unsplash', query: 'sheep portrait' },
      { engine: 'pexels', query: 'sheep close up' },
      { engine: 'pixabay', query: 'sheep head portrait' }
    ],
    minWidth: 1200,
    minHeight: 800
  }
];

// High-quality image source configurations
const searchEngines = {
  unsplash: {
    url: 'https://unsplash.com/s/photos/',
    imageSelector: 'figure a[itemprop="contentUrl"] img',
    downloadLinkSelector: 'a[download]',
    waitTime: 3000,
    highQuality: true
  },
  pexels: {
    url: 'https://www.pexels.com/search/',
    imageSelector: 'article img.photo-item__img',
    waitTime: 3000,
    highQuality: true,
    getSrcFromSrcset: true
  },
  pixabay: {
    url: 'https://pixabay.com/images/search/',
    imageSelector: 'div.item img[src*="photo"]',
    waitTime: 3000,
    highQuality: true
  },
  bing: {
    url: 'https://www.bing.com/images/search?qft=+filterui:license-L2_L3_L4_L5_L6_L7&q=',
    imageSelector: 'img.mimg',
    waitTime: 2000,
    filtered: true // Creative Commons filter
  },
  stockfood: {
    url: 'https://www.google.com/search?tbm=isch&tbs=il:cl&q=site:stockfood.com+',
    imageSelector: 'img[jsname="Q4LuWd"]',
    clickToEnlarge: true,
    largeImageSelector: 'img.n3VNCb',
    waitTime: 3000
  }
};

// Check if image has watermark (basic detection)
async function hasWatermark(imagePath) {
  try {
    // This is a simple check - in production you'd use more sophisticated detection
    const metadata = await sharp(imagePath).metadata();
    
    // Check for common watermark indicators
    // - Text overlays are hard to detect without OCR
    // - But we can check for suspicious patterns in corners
    
    return false; // For now, we'll rely on using high-quality sources
  } catch (error) {
    return false;
  }
}

// Download and validate image
async function downloadAndValidateImage(url, filepath, minWidth, minHeight) {
  return new Promise((resolve, reject) => {
    const tempPath = filepath + '.tmp';
    
    const request = https.get(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadAndValidateImage(response.headers.location, filepath, minWidth, minHeight)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(tempPath);
      response.pipe(file);
      
      file.on('finish', async () => {
        file.close();
        
        try {
          // Check image dimensions
          const metadata = await sharp(tempPath).metadata();
          
          if (metadata.width < minWidth || metadata.height < minHeight) {
            fs.unlinkSync(tempPath);
            reject(new Error(`Low resolution: ${metadata.width}x${metadata.height}`));
            return;
          }
          
          // Move temp file to final location
          fs.renameSync(tempPath, filepath);
          resolve({
            width: metadata.width,
            height: metadata.height,
            format: metadata.format
          });
        } catch (err) {
          fs.unlink(tempPath, () => {});
          reject(err);
        }
      });
      
      file.on('error', (err) => {
        fs.unlink(tempPath, () => {});
        reject(err);
      });
    });
    
    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function searchWithEngine(page, engineName, query, minWidth, minHeight) {
  const engine = searchEngines[engineName];
  if (!engine) return null;
  
  try {
    console.log(`   🔍 ${engineName}: "${query}"`);
    
    let searchUrl = engine.url + encodeURIComponent(query);
    if (engine.filtered) {
      // Already includes filter in URL
    }
    
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(engine.waitTime);
    
    // Handle cookie consent
    try {
      await page.click('button:has-text("Accept")', { timeout: 2000 });
    } catch (e) {}
    
    // For Unsplash, try to get download link directly
    if (engineName === 'unsplash') {
      try {
        // Click on first image
        const firstImage = await page.$('figure a[itemprop="contentUrl"]');
        if (firstImage) {
          await firstImage.click();
          await page.waitForTimeout(2000);
          
          // Look for download button
          const downloadBtn = await page.$('a[download]');
          if (downloadBtn) {
            const href = await downloadBtn.getAttribute('href');
            if (href) {
              console.log(`      Found Unsplash download link`);
              return href;
            }
          }
        }
      } catch (e) {}
    }
    
    // For Pexels, look for original quality images
    if (engineName === 'pexels') {
      const images = await page.$$('article img.photo-item__img');
      for (let i = 0; i < Math.min(5, images.length); i++) {
        try {
          const srcset = await images[i].getAttribute('srcset');
          if (srcset) {
            // Get the highest resolution from srcset
            const sources = srcset.split(',').map(s => s.trim());
            for (const source of sources) {
              if (source.includes('1600') || source.includes('1920')) {
                const url = source.split(' ')[0];
                console.log(`      Found high-res Pexels image`);
                return url;
              }
            }
          }
        } catch (e) {}
      }
    }
    
    // Generic image search
    const images = await page.$$(engine.imageSelector);
    console.log(`      Found ${images.length} images`);
    
    for (let i = 0; i < Math.min(8, images.length); i++) {
      try {
        let imageUrl = null;
        
        if (engine.clickToEnlarge) {
          await images[i].click();
          await page.waitForTimeout(1500);
          
          const largeImage = await page.$(engine.largeImageSelector);
          if (largeImage) {
            imageUrl = await largeImage.getAttribute('src');
          }
        } else if (engine.getSrcFromSrcset) {
          const srcset = await images[i].getAttribute('srcset');
          if (srcset) {
            const sources = srcset.split(',').map(s => s.trim().split(' '));
            imageUrl = sources[sources.length - 1][0];
          }
        } else {
          imageUrl = await images[i].getAttribute('src');
        }
        
        if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('base64')) {
          // Skip if URL contains common watermark indicators
          if (imageUrl.includes('watermark') || 
              imageUrl.includes('shutterstock') || 
              imageUrl.includes('gettyimages') ||
              imageUrl.includes('istockphoto') ||
              imageUrl.includes('adobe') ||
              imageUrl.includes('123rf')) {
            console.log(`      Skipping watermarked source`);
            continue;
          }
          
          return imageUrl;
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.log(`      Error: ${error.message}`);
    return null;
  }
}

async function searchHighQualityImages() {
  // Check if sharp is installed
  try {
    require('sharp');
  } catch (e) {
    console.log('⚠️  Installing sharp for image validation...');
    require('child_process').execSync('npm install sharp', { stdio: 'inherit' });
  }
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  const imagesDir = path.join(__dirname, 'public', 'images', 'products');
  
  console.log('🐑 Searching for High-Quality, Watermark-Free Images\n');
  console.log('📋 Requirements: No watermarks, minimum 1200x800px\n');
  
  let successCount = 0;
  let failCount = 0;
  const results = [];
  
  for (const config of remainingImages) {
    const imagePath = path.join(imagesDir, config.filename);
    
    console.log(`\n📸 ${config.filename} (min: ${config.minWidth}x${config.minHeight})`);
    
    let downloaded = false;
    
    for (const search of config.searches) {
      if (downloaded) break;
      
      const imageUrl = await searchWithEngine(page, search.engine, search.query, config.minWidth, config.minHeight);
      
      if (imageUrl) {
        try {
          console.log(`   📥 Downloading and validating...`);
          const metadata = await downloadAndValidateImage(imageUrl, imagePath, config.minWidth, config.minHeight);
          console.log(`   ✅ Success! ${metadata.width}x${metadata.height} ${metadata.format}`);
          successCount++;
          downloaded = true;
          
          results.push({
            filename: config.filename,
            status: 'success',
            source: search.engine,
            dimensions: `${metadata.width}x${metadata.height}`
          });
        } catch (err) {
          console.log(`   ❌ ${err.message}`);
        }
      }
    }
    
    if (!downloaded) {
      console.log(`   ⚠️  No suitable high-quality image found`);
      failCount++;
      results.push({
        filename: config.filename,
        status: 'failed'
      });
    }
    
    await page.waitForTimeout(2000);
  }
  
  await browser.close();
  
  console.log('\n📊 High-Quality Image Search Results:');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  console.log('\n📁 Image Quality Report:');
  results.forEach(r => {
    if (r.status === 'success') {
      console.log(`   ✅ ${r.filename.padEnd(25)} ${r.dimensions.padEnd(15)} from ${r.source}`);
    } else {
      console.log(`   ❌ ${r.filename.padEnd(25)} (placeholder remains)`);
    }
  });
}

searchHighQualityImages().catch(console.error);