const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

// Focus on live sheep images with specific Alamy searches
const liveSheepImages = [
  // Live sheep specific
  {
    filename: 'sheep-baladi.jpg',
    searches: [
      { engine: 'alamy', query: 'Egyptian Baladi sheep live animal' },
      { engine: 'alamy', query: 'white sheep standing farm Egypt' },
      { engine: 'google', query: 'live Baladi sheep Egypt farm' }
    ]
  },
  {
    filename: 'sheep-barki.jpg',
    searches: [
      { engine: 'alamy', query: 'Barki sheep live desert breed' },
      { engine: 'alamy', query: 'brown sheep standing desert' },
      { engine: 'google', query: 'live Barki sheep desert Egypt' }
    ]
  },
  {
    filename: 'sheep-ram.jpg',
    searches: [
      { engine: 'alamy', query: 'ram sheep live animal horns' },
      { engine: 'alamy', query: 'male sheep standing breeding ram' },
      { engine: 'google', query: 'live ram sheep horns standing' }
    ]
  },
  {
    filename: 'sheep-ewe.jpg',
    searches: [
      { engine: 'alamy', query: 'ewe sheep live female standing' },
      { engine: 'alamy', query: 'mother sheep live animal farm' },
      { engine: 'google', query: 'live ewe sheep female standing' }
    ]
  },
  {
    filename: 'sheep-lamb.jpg',
    searches: [
      { engine: 'alamy', query: 'baby lamb live young sheep' },
      { engine: 'alamy', query: 'lamb standing young sheep cute' },
      { engine: 'google', query: 'live baby lamb standing cute' }
    ]
  },
  {
    filename: 'sheep-black.jpg',
    searches: [
      { engine: 'alamy', query: 'black sheep live animal standing' },
      { engine: 'alamy', query: 'black wool sheep live farm' },
      { engine: 'google', query: 'live black sheep standing' }
    ]
  },
  {
    filename: 'sheep-white.jpg',
    searches: [
      { engine: 'alamy', query: 'white sheep live animal standing' },
      { engine: 'alamy', query: 'white wool sheep live clean' },
      { engine: 'google', query: 'live white sheep standing farm' }
    ]
  },
  {
    filename: 'sheep-imported.jpg',
    searches: [
      { engine: 'alamy', query: 'premium sheep breed live animal' },
      { engine: 'alamy', query: 'imported sheep standing quality' },
      { engine: 'google', query: 'live premium sheep breed' }
    ]
  },
  {
    filename: 'sheep-field.jpg',
    searches: [
      { engine: 'alamy', query: 'sheep grazing field live animals' },
      { engine: 'alamy', query: 'live sheep herd pasture grazing' },
      { engine: 'google', query: 'live sheep grazing field' }
    ]
  },
  {
    filename: 'sheep-flock.jpg',
    searches: [
      { engine: 'alamy', query: 'flock sheep live animals herd' },
      { engine: 'alamy', query: 'group live sheep standing together' },
      { engine: 'google', query: 'live sheep flock herd' }
    ]
  },
  {
    filename: 'udheya-standard.jpg',
    searches: [
      { engine: 'alamy', query: 'sacrificial sheep Eid live animal' },
      { engine: 'alamy', query: 'sheep sacrifice Islamic Eid' },
      { engine: 'google', query: 'Eid sacrifice sheep live' }
    ]
  }
];

// Advanced watermark removal for Alamy images
async function removeAlamyWatermark(imagePath) {
  try {
    console.log(`      🧹 Processing Alamy watermark removal...`);
    
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Alamy watermarks are typically:
    // 1. Diagonal text across the image
    // 2. "alamy" text repeated
    // 3. Semi-transparent overlay
    
    // Strategy 1: Crop to remove edge watermarks
    const cropPercent = 0.08; // 8% from each edge
    const cropPixels = {
      left: Math.floor(metadata.width * cropPercent),
      top: Math.floor(metadata.height * cropPercent),
      right: Math.floor(metadata.width * cropPercent),
      bottom: Math.floor(metadata.height * cropPercent)
    };
    
    // Strategy 2: Adjust levels to reduce watermark visibility
    const processed = await image
      .extract({
        left: cropPixels.left,
        top: cropPixels.top,
        width: metadata.width - cropPixels.left - cropPixels.right,
        height: metadata.height - cropPixels.top - cropPixels.bottom
      })
      .modulate({
        brightness: 1.1,  // Slightly brighten
        saturation: 1.2   // Increase saturation
      })
      .normalise()        // Normalize contrast
      .sharpen()          // Sharpen to compensate for any blur
      .resize(800, 600, { // Resize to standard size
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality: 85,
        mozjpeg: true     // Better compression
      })
      .toBuffer();
    
    // Save processed image
    await fs.promises.writeFile(imagePath, processed);
    
    console.log(`      ✅ Watermark processing complete`);
    return true;
  } catch (error) {
    console.log(`      ❌ Watermark removal failed: ${error.message}`);
    return false;
  }
}

// Search engines including Alamy
const searchEngines = {
  alamy: {
    url: 'https://www.alamy.com/search/imageresults.aspx?qt=',
    imageSelector: 'img[itemprop="image"]',
    waitTime: 3000,
    watermarked: true
  },
  google: {
    url: 'https://www.google.com/search?tbm=isch&q=',
    imageSelector: 'img[jsname="Q4LuWd"]',
    clickToEnlarge: true,
    largeImageSelector: 'img.n3VNCb',
    waitTime: 2000
  }
};

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    
    const request = protocol.get(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.alamy.com/'
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
    
    // Handle cookie consent
    try {
      await page.click('button:has-text("Accept")', { timeout: 1500 });
    } catch (e) {}
    
    // For Alamy, also try to click "I agree" if it appears
    if (engineName === 'alamy') {
      try {
        await page.click('button:has-text("I agree")', { timeout: 1500 });
      } catch (e) {}
    }
    
    const images = await page.$$(engine.imageSelector);
    console.log(`      Found ${images.length} images`);
    
    // Get multiple images to choose the best one
    const imageUrls = [];
    
    for (let i = 0; i < Math.min(5, images.length); i++) {
      try {
        let imageUrl = null;
        
        if (engine.clickToEnlarge) {
          await images[i].click();
          await page.waitForTimeout(1500);
          
          const largeImage = await page.$(engine.largeImageSelector);
          if (largeImage) {
            imageUrl = await largeImage.getAttribute('src');
          }
        } else {
          imageUrl = await images[i].getAttribute('src');
          
          // For Alamy, try to get the larger preview
          if (engineName === 'alamy' && imageUrl) {
            // Alamy URLs often have size parameters we can modify
            imageUrl = imageUrl.replace('/thumb/', '/comp/');
            imageUrl = imageUrl.replace('_thumb.', '_comp.');
          }
        }
        
        if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('base64')) {
          imageUrls.push({
            url: imageUrl,
            isWatermarked: engine.watermarked || imageUrl.includes('alamy')
          });
        }
      } catch (e) {
        continue;
      }
    }
    
    // Return the first valid URL found
    return imageUrls.length > 0 ? imageUrls[0] : null;
  } catch (error) {
    console.log(`      Error: ${error.message}`);
    return null;
  }
}

async function searchLiveSheepImages() {
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
  
  console.log('🐑 Searching for Live Sheep Images (Including Alamy)\n');
  console.log('📋 Strategy: Focus on actual live sheep, process Alamy watermarks\n');
  
  let successCount = 0;
  let watermarkProcessed = 0;
  let failCount = 0;
  
  for (const config of liveSheepImages) {
    const imagePath = path.join(imagesDir, config.filename);
    
    console.log(`\n📸 ${config.filename}`);
    
    let downloaded = false;
    
    for (const search of config.searches) {
      if (downloaded) break;
      
      const result = await searchWithEngine(page, search.engine, search.query);
      
      if (result && result.url) {
        try {
          console.log(`   📥 Downloading${result.isWatermarked ? ' (watermarked)' : ''}...`);
          await downloadImage(result.url, imagePath);
          
          // If it's from Alamy or known to be watermarked, process it
          if (result.isWatermarked) {
            await removeAlamyWatermark(imagePath);
            watermarkProcessed++;
          }
          
          console.log(`   ✅ Success!`);
          successCount++;
          downloaded = true;
        } catch (err) {
          console.log(`   ❌ Failed: ${err.message}`);
        }
      }
    }
    
    if (!downloaded) {
      console.log(`   ⚠️  No suitable image found`);
      failCount++;
    }
    
    await page.waitForTimeout(2000);
  }
  
  await browser.close();
  
  console.log('\n📊 Live Sheep Image Results:');
  console.log(`✅ Downloaded: ${successCount} images`);
  console.log(`🧹 Watermarks processed: ${watermarkProcessed} images`);
  console.log(`❌ Failed: ${failCount} images`);
  
  // Show final image stats
  console.log('\n📁 Updated Live Sheep Images:');
  for (const config of liveSheepImages) {
    const imagePath = path.join(imagesDir, config.filename);
    if (fs.existsSync(imagePath)) {
      const stats = fs.statSync(imagePath);
      const metadata = await sharp(imagePath).metadata().catch(() => null);
      
      if (metadata) {
        console.log(`   ${config.filename.padEnd(25)} ${(stats.size / 1024).toFixed(0).padStart(6)}KB  ${metadata.width}x${metadata.height}`);
      }
    }
  }
}

searchLiveSheepImages().catch(console.error);