const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Remaining images to search
const remainingImages = [
  {
    filename: 'sheep-black.jpg',
    searches: [
      { engine: 'bing', query: 'black sheep wool farm animal' },
      { engine: 'duckduckgo', query: 'black colored sheep livestock' },
      { engine: 'pixabay', query: 'black sheep' }
    ]
  },
  {
    filename: 'sheep-white.jpg',
    searches: [
      { engine: 'bing', query: 'white sheep wool clean farm' },
      { engine: 'duckduckgo', query: 'white wool sheep merino' },
      { engine: 'pixabay', query: 'white sheep' }
    ]
  },
  {
    filename: 'sheep-imported.jpg',
    searches: [
      { engine: 'bing', query: 'premium sheep breed imported' },
      { engine: 'duckduckgo', query: 'high quality sheep livestock' },
      { engine: 'pixabay', query: 'sheep breed premium' }
    ]
  },
  {
    filename: 'lamb-shoulder.jpg', // Retry the failed one
    searches: [
      { engine: 'bing', query: 'raw lamb shoulder meat cut' },
      { engine: 'duckduckgo', query: 'lamb shoulder boneless raw' },
      { engine: 'pixabay', query: 'lamb shoulder meat' }
    ]
  },
  {
    filename: 'lamb-cuts.jpg',
    searches: [
      { engine: 'bing', query: 'diced lamb meat cubes stew' },
      { engine: 'duckduckgo', query: 'mutton stew meat cuts' },
      { engine: 'pixabay', query: 'meat cubes lamb' }
    ]
  },
  {
    filename: 'meat-steak.jpg',
    searches: [
      { engine: 'bing', query: 'lamb steak raw meat premium' },
      { engine: 'duckduckgo', query: 'lamb loin steak raw' },
      { engine: 'pixabay', query: 'lamb steak meat' }
    ]
  },
  {
    filename: 'sheep-field.jpg',
    searches: [
      { engine: 'bing', query: 'sheep grazing field pastoral' },
      { engine: 'pixabay', query: 'sheep field grazing' },
      { engine: 'pexels', query: 'sheep pasture field' }
    ]
  },
  {
    filename: 'sheep-flock.jpg',
    searches: [
      { engine: 'bing', query: 'flock of sheep herd pasture' },
      { engine: 'pixabay', query: 'sheep flock group' },
      { engine: 'pexels', query: 'sheep herd flock' }
    ]
  },
  {
    filename: 'udheya-standard.jpg',
    searches: [
      { engine: 'bing', query: 'sheep sacrifice Eid al Adha' },
      { engine: 'duckduckgo', query: 'Eid sheep sacrifice halal' },
      { engine: 'pixabay', query: 'sheep Eid sacrifice' }
    ]
  }
];

// Search engine configurations
const searchEngines = {
  bing: {
    url: 'https://www.bing.com/images/search?q=',
    imageSelector: 'img.mimg',
    waitTime: 2000
  },
  duckduckgo: {
    url: 'https://duckduckgo.com/?iax=images&ia=images&q=',
    imageSelector: 'img.tile--img__img',
    waitTime: 3000
  },
  pixabay: {
    url: 'https://pixabay.com/images/search/',
    imageSelector: 'img[srcset]',
    getSrcFromSrcset: true,
    waitTime: 2000
  },
  pexels: {
    url: 'https://www.pexels.com/search/',
    imageSelector: 'img.photo-item__img',
    getSrcFromSrcset: true,
    waitTime: 2000
  }
};

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close(resolve);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
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

async function searchWithEngine(page, engineName, query) {
  const engine = searchEngines[engineName];
  if (!engine) return null;
  
  try {
    console.log(`   🔍 ${engineName}: "${query}"`);
    
    const searchUrl = engine.url + encodeURIComponent(query);
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(engine.waitTime);
    
    // Accept cookies if needed
    try {
      await page.click('button:has-text("Accept")', { timeout: 2000 });
    } catch (e) {}
    
    const images = await page.$$(engine.imageSelector);
    console.log(`      Found ${images.length} images`);
    
    for (let i = 0; i < Math.min(5, images.length); i++) {
      try {
        let imageUrl = null;
        
        if (engine.getSrcFromSrcset) {
          const srcset = await images[i].getAttribute('srcset');
          if (srcset) {
            const sources = srcset.split(',').map(s => s.trim().split(' '));
            imageUrl = sources[sources.length - 1][0];
          }
        } else {
          imageUrl = await images[i].getAttribute('src');
        }
        
        if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('base64')) {
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

async function searchRemainingImages() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  const imagesDir = path.join(__dirname, 'public', 'images', 'products');
  
  console.log('🐑 Searching for Remaining Product Images\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const config of remainingImages) {
    const imagePath = path.join(imagesDir, config.filename);
    
    console.log(`\n📸 ${config.filename}`);
    
    let downloaded = false;
    
    for (const search of config.searches) {
      if (downloaded) break;
      
      const imageUrl = await searchWithEngine(page, search.engine, search.query);
      
      if (imageUrl) {
        try {
          console.log(`   📥 Downloading...`);
          await downloadImage(imageUrl, imagePath);
          console.log(`   ✅ Success!`);
          successCount++;
          downloaded = true;
        } catch (err) {
          console.log(`   ❌ Download failed: ${err.message}`);
        }
      }
    }
    
    if (!downloaded) {
      console.log(`   ⚠️  Failed`);
      failCount++;
    }
    
    await page.waitForTimeout(2000);
  }
  
  await browser.close();
  
  console.log('\n📊 Results:');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  // List all current images
  console.log('\n📁 All product images:');
  const files = fs.readdirSync(imagesDir)
    .filter(f => f.endsWith('.jpg') && !f.includes('placeholder'))
    .sort();
  
  files.forEach(file => {
    const stats = fs.statSync(path.join(imagesDir, file));
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   ${file.padEnd(30)} (${sizeMB} MB)`);
  });
}

searchRemainingImages().catch(console.error);