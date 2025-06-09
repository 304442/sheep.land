const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

// Simplified search terms focusing on actual names
const sheepImageSearches = [
  // Sheep breeds - simple terms
  {
    filename: 'sheep-baladi.jpg',
    searches: [
      { engine: 'pexels', query: 'white sheep' },
      { engine: 'alamy', query: 'Baladi sheep' },
      { engine: 'pexels', query: 'sheep standing' }
    ]
  },
  {
    filename: 'sheep-barki.jpg',
    searches: [
      { engine: 'pexels', query: 'brown sheep' },
      { engine: 'alamy', query: 'Barki sheep' },
      { engine: 'pexels', query: 'desert sheep' }
    ]
  },
  {
    filename: 'sheep-ram.jpg',
    searches: [
      { engine: 'pexels', query: 'ram sheep' },
      { engine: 'alamy', query: 'ram horns' },
      { engine: 'pexels', query: 'male sheep' }
    ]
  },
  {
    filename: 'sheep-ewe.jpg',
    searches: [
      { engine: 'pexels', query: 'ewe sheep' },
      { engine: 'alamy', query: 'female sheep' },
      { engine: 'pexels', query: 'mother sheep' }
    ]
  },
  {
    filename: 'sheep-lamb.jpg',
    searches: [
      { engine: 'pexels', query: 'baby lamb' },
      { engine: 'alamy', query: 'young lamb' },
      { engine: 'pexels', query: 'lamb' }
    ]
  },
  {
    filename: 'sheep-black.jpg',
    searches: [
      { engine: 'pexels', query: 'black sheep' },
      { engine: 'alamy', query: 'black sheep' },
      { engine: 'pexels', query: 'dark sheep' }
    ]
  },
  {
    filename: 'sheep-white.jpg',
    searches: [
      { engine: 'pexels', query: 'white sheep' },
      { engine: 'alamy', query: 'white sheep' },
      { engine: 'pexels', query: 'sheep wool' }
    ]
  },
  {
    filename: 'sheep-imported.jpg',
    searches: [
      { engine: 'pexels', query: 'sheep' },
      { engine: 'alamy', query: 'sheep breed' },
      { engine: 'pexels', query: 'sheep farm' }
    ]
  },
  
  // Meat - simple terms
  {
    filename: 'lamb-ribs.jpg',
    searches: [
      { engine: 'pexels', query: 'lamb chops' },
      { engine: 'alamy', query: 'lamb ribs' },
      { engine: 'pexels', query: 'raw lamb' }
    ]
  },
  {
    filename: 'lamb-leg.jpg',
    searches: [
      { engine: 'pexels', query: 'lamb leg' },
      { engine: 'alamy', query: 'leg of lamb' },
      { engine: 'pexels', query: 'lamb roast' }
    ]
  },
  {
    filename: 'lamb-shoulder.jpg',
    searches: [
      { engine: 'pexels', query: 'lamb shoulder' },
      { engine: 'alamy', query: 'lamb shoulder' },
      { engine: 'pexels', query: 'raw lamb' }
    ]
  },
  {
    filename: 'lamb-minced.jpg',
    searches: [
      { engine: 'pexels', query: 'ground lamb' },
      { engine: 'alamy', query: 'minced lamb' },
      { engine: 'pexels', query: 'lamb mince' }
    ]
  },
  {
    filename: 'lamb-cuts.jpg',
    searches: [
      { engine: 'pexels', query: 'meat cubes' },
      { engine: 'alamy', query: 'lamb cubes' },
      { engine: 'pexels', query: 'diced meat' }
    ]
  },
  {
    filename: 'meat-steak.jpg',
    searches: [
      { engine: 'pexels', query: 'lamb steak' },
      { engine: 'alamy', query: 'lamb steak' },
      { engine: 'pexels', query: 'raw steak' }
    ]
  },
  
  // Events - simple terms
  {
    filename: 'event-small-gathering.jpg',
    searches: [
      { engine: 'pexels', query: 'family dinner' },
      { engine: 'alamy', query: 'Arabic dinner' },
      { engine: 'pexels', query: 'family meal' }
    ]
  },
  {
    filename: 'event-large-gathering.jpg',
    searches: [
      { engine: 'pexels', query: 'wedding feast' },
      { engine: 'alamy', query: 'banquet' },
      { engine: 'pexels', query: 'celebration feast' }
    ]
  },
  {
    filename: 'event-catering.jpg',
    searches: [
      { engine: 'pexels', query: 'BBQ kebab' },
      { engine: 'alamy', query: 'mixed grill' },
      { engine: 'pexels', query: 'kebab grill' }
    ]
  },
  
  // General
  {
    filename: 'sheep-field.jpg',
    searches: [
      { engine: 'pexels', query: 'sheep field' },
      { engine: 'alamy', query: 'sheep grazing' },
      { engine: 'pexels', query: 'sheep pasture' }
    ]
  },
  {
    filename: 'sheep-flock.jpg',
    searches: [
      { engine: 'pexels', query: 'sheep flock' },
      { engine: 'alamy', query: 'sheep herd' },
      { engine: 'pexels', query: 'group sheep' }
    ]
  },
  {
    filename: 'udheya-standard.jpg',
    searches: [
      { engine: 'pexels', query: 'sheep portrait' },
      { engine: 'alamy', query: 'Eid sheep' },
      { engine: 'pexels', query: 'sheep close' }
    ]
  }
];

// Simple watermark processing
async function processWatermarkedImage(imagePath, isAlamy = false) {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    let processedImage = image;
    
    if (isAlamy) {
      // For Alamy, crop more aggressively and adjust
      processedImage = processedImage
        .extract({
          left: Math.floor(metadata.width * 0.1),
          top: Math.floor(metadata.height * 0.1),
          width: Math.floor(metadata.width * 0.8),
          height: Math.floor(metadata.height * 0.8)
        })
        .modulate({
          brightness: 1.15,
          saturation: 1.1
        });
    }
    
    // Standard processing for all images
    await processedImage
      .resize(800, 600, {
        fit: 'cover',
        position: 'center'
      })
      .sharpen()
      .jpeg({ quality: 85 })
      .toFile(imagePath + '.tmp');
    
    // Replace original
    fs.unlinkSync(imagePath);
    fs.renameSync(imagePath + '.tmp', imagePath);
    
    return true;
  } catch (error) {
    console.log(`      Processing error: ${error.message}`);
    return false;
  }
}

// Search engines - Pexels and Alamy
const searchEngines = {
  pexels: {
    url: 'https://www.pexels.com/search/',
    imageSelector: 'article img.photo-item__img',
    waitTime: 3000,
    getSrcFromSrcset: true
  },
  alamy: {
    url: 'https://www.alamy.com/search/imageresults.aspx?qt=',
    imageSelector: 'img[itemprop="image"], img.thumbimg',
    waitTime: 3000,
    watermarked: true
  }
};

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    
    const request = protocol.get(url, { 
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
        file.close();
        resolve();
      });
    });
    
    request.on('error', reject);
  });
}

async function searchWithEngine(page, engineName, query) {
  const engine = searchEngines[engineName];
  if (!engine) return null;
  
  try {
    console.log(`   🔍 ${engineName}: "${query}"`);
    
    const searchUrl = engine.url + encodeURIComponent(query);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(engine.waitTime);
    
    // Handle cookies/consent
    try {
      await page.click('button:has-text("Accept"), button:has-text("I agree"), button:has-text("Got it")', { timeout: 1000 });
    } catch (e) {}
    
    // Wait for images to load
    await page.waitForSelector(engine.imageSelector, { timeout: 5000 }).catch(() => {});
    
    const images = await page.$$(engine.imageSelector);
    console.log(`      Found ${images.length} images`);
    
    if (images.length === 0) return null;
    
    // Get image URLs
    for (let i = 0; i < Math.min(8, images.length); i++) {
      try {
        let imageUrl = null;
        
        if (engine.getSrcFromSrcset) {
          // For Pexels, get high quality from srcset
          const srcset = await images[i].getAttribute('srcset');
          if (srcset) {
            const sources = srcset.split(',').map(s => s.trim());
            // Get medium quality (not the highest to avoid huge files)
            const mediumQuality = sources.find(s => s.includes('w=1600') || s.includes('w=1200'));
            if (mediumQuality) {
              imageUrl = mediumQuality.split(' ')[0];
            } else {
              imageUrl = sources[sources.length - 1].split(' ')[0];
            }
          }
        } else {
          // For Alamy and others
          imageUrl = await images[i].getAttribute('src');
          
          // Try to get larger Alamy preview
          if (engineName === 'alamy' && imageUrl) {
            imageUrl = imageUrl.replace('thumbs/', 'comp/').replace('_thumb.', '_comp.');
          }
        }
        
        if (imageUrl && imageUrl.startsWith('http')) {
          return {
            url: imageUrl,
            isAlamy: engineName === 'alamy' || imageUrl.includes('alamy')
          };
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

async function searchImagesSimple() {
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
  
  console.log('🐑 Searching with Simple Terms (Pexels & Alamy)\n');
  
  let successCount = 0;
  let processedCount = 0;
  let failCount = 0;
  
  for (const config of sheepImageSearches) {
    const imagePath = path.join(imagesDir, config.filename);
    
    console.log(`\n📸 ${config.filename}`);
    
    let downloaded = false;
    
    for (const search of config.searches) {
      if (downloaded) break;
      
      const result = await searchWithEngine(page, search.engine, search.query);
      
      if (result && result.url) {
        try {
          console.log(`   📥 Downloading...`);
          await downloadImage(result.url, imagePath);
          
          // Process the image
          console.log(`   🔧 Processing image...`);
          await processWatermarkedImage(imagePath, result.isAlamy);
          processedCount++;
          
          console.log(`   ✅ Success!`);
          successCount++;
          downloaded = true;
        } catch (err) {
          console.log(`   ❌ Failed: ${err.message}`);
        }
      }
    }
    
    if (!downloaded) {
      console.log(`   ⚠️  No image found`);
      failCount++;
    }
    
    await page.waitForTimeout(1500);
  }
  
  await browser.close();
  
  console.log('\n📊 Results:');
  console.log(`✅ Downloaded: ${successCount}`);
  console.log(`🔧 Processed: ${processedCount}`);
  console.log(`❌ Failed: ${failCount}`);
}

searchImagesSimple().catch(console.error);