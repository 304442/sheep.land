const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const sharp = require('sharp');

// All images to search/update
const allProductImages = [
  // Sheep breeds
  {
    filename: 'sheep-baladi.jpg',
    searches: [
      { engine: 'bing', query: 'Egyptian Baladi sheep white' },
      { engine: 'google', query: 'white sheep farm animal' },
      { engine: 'yandex', query: 'sheep livestock white' }
    ]
  },
  {
    filename: 'sheep-barki.jpg',
    searches: [
      { engine: 'bing', query: 'Barki sheep desert brown' },
      { engine: 'google', query: 'brown sheep desert breed' },
      { engine: 'yandex', query: 'desert sheep tan' }
    ]
  },
  {
    filename: 'sheep-ram.jpg',
    searches: [
      { engine: 'bing', query: 'ram sheep horns male' },
      { engine: 'google', query: 'male ram breeding sheep' },
      { engine: 'yandex', query: 'ram horns livestock' }
    ]
  },
  {
    filename: 'sheep-ewe.jpg',
    searches: [
      { engine: 'bing', query: 'female sheep ewe mother' },
      { engine: 'google', query: 'ewe sheep female breeding' },
      { engine: 'yandex', query: 'mother sheep ewe' }
    ]
  },
  {
    filename: 'sheep-lamb.jpg',
    searches: [
      { engine: 'bing', query: 'baby lamb young sheep' },
      { engine: 'google', query: 'lamb baby sheep cute' },
      { engine: 'yandex', query: 'young lamb animal' }
    ]
  },
  {
    filename: 'sheep-black.jpg',
    searches: [
      { engine: 'bing', query: 'black sheep wool animal' },
      { engine: 'google', query: 'black colored sheep' },
      { engine: 'yandex', query: 'black sheep farm' }
    ]
  },
  {
    filename: 'sheep-white.jpg',
    searches: [
      { engine: 'bing', query: 'white sheep wool clean' },
      { engine: 'google', query: 'white sheep merino' },
      { engine: 'yandex', query: 'white wool sheep' }
    ]
  },
  {
    filename: 'sheep-imported.jpg',
    searches: [
      { engine: 'bing', query: 'premium sheep breed' },
      { engine: 'google', query: 'high quality sheep' },
      { engine: 'yandex', query: 'imported sheep breed' }
    ]
  },
  
  // Meat products
  {
    filename: 'lamb-ribs.jpg',
    searches: [
      { engine: 'bing', query: 'lamb chops raw meat ribs' },
      { engine: 'google', query: 'raw lamb rack ribs' },
      { engine: 'yandex', query: 'lamb rib chops meat' }
    ]
  },
  {
    filename: 'lamb-leg.jpg',
    searches: [
      { engine: 'bing', query: 'leg of lamb raw meat' },
      { engine: 'google', query: 'whole lamb leg roast' },
      { engine: 'yandex', query: 'lamb leg meat raw' }
    ]
  },
  {
    filename: 'lamb-shoulder.jpg',
    searches: [
      { engine: 'bing', query: 'lamb shoulder meat raw' },
      { engine: 'google', query: 'raw shoulder lamb cut' },
      { engine: 'yandex', query: 'lamb shoulder boneless' }
    ]
  },
  {
    filename: 'lamb-minced.jpg',
    searches: [
      { engine: 'bing', query: 'ground lamb meat mince' },
      { engine: 'google', query: 'minced lamb raw meat' },
      { engine: 'yandex', query: 'lamb mince ground' }
    ]
  },
  {
    filename: 'lamb-cuts.jpg',
    searches: [
      { engine: 'bing', query: 'diced lamb meat cubes' },
      { engine: 'google', query: 'lamb stew meat cuts' },
      { engine: 'yandex', query: 'mutton cubes meat' }
    ]
  },
  {
    filename: 'meat-steak.jpg',
    searches: [
      { engine: 'bing', query: 'lamb steak raw meat' },
      { engine: 'google', query: 'raw lamb steak cut' },
      { engine: 'yandex', query: 'lamb loin steak' }
    ]
  },
  
  // Events
  {
    filename: 'event-small-gathering.jpg',
    searches: [
      { engine: 'bing', query: 'Middle Eastern family dinner' },
      { engine: 'google', query: 'Arabic family feast meal' },
      { engine: 'yandex', query: 'family dinner Middle East' }
    ]
  },
  {
    filename: 'event-large-gathering.jpg',
    searches: [
      { engine: 'bing', query: 'Arabic wedding feast banquet' },
      { engine: 'google', query: 'Middle Eastern celebration' },
      { engine: 'yandex', query: 'large banquet Arabic' }
    ]
  },
  {
    filename: 'event-catering.jpg',
    searches: [
      { engine: 'bing', query: 'Middle Eastern BBQ kebab' },
      { engine: 'google', query: 'Arabic mixed grill BBQ' },
      { engine: 'yandex', query: 'kebab grill Middle East' }
    ]
  },
  
  // Additional
  {
    filename: 'sheep-field.jpg',
    searches: [
      { engine: 'bing', query: 'sheep grazing field pastoral' },
      { engine: 'google', query: 'sheep in pasture field' },
      { engine: 'yandex', query: 'sheep field grazing' }
    ]
  },
  {
    filename: 'sheep-flock.jpg',
    searches: [
      { engine: 'bing', query: 'flock of sheep herd' },
      { engine: 'google', query: 'sheep flock group pasture' },
      { engine: 'yandex', query: 'herd sheep flock' }
    ]
  },
  {
    filename: 'udheya-standard.jpg',
    searches: [
      { engine: 'bing', query: 'sheep sacrifice Eid' },
      { engine: 'google', query: 'Eid al Adha sheep' },
      { engine: 'yandex', query: 'sacrificial sheep Eid' }
    ]
  }
];

// Search engines - more flexible now
const searchEngines = {
  bing: {
    url: 'https://www.bing.com/images/search?q=',
    imageSelector: 'img.mimg',
    waitTime: 2000
  },
  google: {
    url: 'https://www.google.com/search?tbm=isch&q=',
    imageSelector: 'img[jsname="Q4LuWd"]',
    clickToEnlarge: true,
    largeImageSelector: 'img.n3VNCb',
    waitTime: 2000
  },
  yandex: {
    url: 'https://yandex.com/images/search?text=',
    imageSelector: 'img.serp-item__thumb',
    waitTime: 2000
  }
};

// Try to remove watermark using sharp (basic attempt)
async function attemptWatermarkRemoval(imagePath) {
  try {
    const outputPath = imagePath.replace('.jpg', '-cleaned.jpg');
    
    // Basic watermark removal strategies:
    // 1. Crop edges where watermarks often appear
    // 2. Adjust contrast/brightness to reduce visibility
    
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Crop 10% from edges where watermarks typically appear
    const cropAmount = {
      left: Math.floor(metadata.width * 0.05),
      right: Math.floor(metadata.width * 0.05),
      top: Math.floor(metadata.height * 0.05),
      bottom: Math.floor(metadata.height * 0.05)
    };
    
    await image
      .extract({
        left: cropAmount.left,
        top: cropAmount.top,
        width: metadata.width - cropAmount.left - cropAmount.right,
        height: metadata.height - cropAmount.top - cropAmount.bottom
      })
      .resize(800, 600) // Resize to standard size
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    
    // Replace original with cleaned version
    fs.unlinkSync(imagePath);
    fs.renameSync(outputPath, imagePath);
    
    return true;
  } catch (error) {
    console.log(`      Could not process image: ${error.message}`);
    return false;
  }
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
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
    
    // Accept cookies
    try {
      await page.click('button:has-text("Accept")', { timeout: 1500 });
    } catch (e) {}
    
    const images = await page.$$(engine.imageSelector);
    console.log(`      Found ${images.length} images`);
    
    // Try multiple images to find one that works
    for (let i = 0; i < Math.min(10, images.length); i++) {
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
        }
        
        // Accept any image URL that's valid
        if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('base64')) {
          // Skip obvious ad/spam domains
          if (imageUrl.includes('adsystem') || 
              imageUrl.includes('doubleclick') ||
              imageUrl.includes('googlesyndication')) {
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

async function searchAllImagesFlexible() {
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
  
  console.log('🐑 Searching for All Product Images (Flexible Requirements)\n');
  console.log('📋 Strategy: Accept any resolution, attempt watermark removal\n');
  
  let successCount = 0;
  let failCount = 0;
  let processedCount = 0;
  
  for (const config of allProductImages) {
    const imagePath = path.join(imagesDir, config.filename);
    
    console.log(`\n📸 ${config.filename}`);
    
    // Check if we already have a non-placeholder image
    if (fs.existsSync(imagePath)) {
      const stats = fs.statSync(imagePath);
      if (stats.size > 50000) { // Larger than typical placeholder
        console.log(`   ✓ Already has real image (${(stats.size / 1024).toFixed(0)}KB)`);
        continue;
      }
    }
    
    let downloaded = false;
    
    for (const search of config.searches) {
      if (downloaded) break;
      
      const imageUrl = await searchWithEngine(page, search.engine, search.query);
      
      if (imageUrl) {
        try {
          console.log(`   📥 Downloading...`);
          await downloadImage(imageUrl, imagePath);
          
          // Check if image might have watermark
          const metadata = await sharp(imagePath).metadata();
          console.log(`   📐 Downloaded: ${metadata.width}x${metadata.height}`);
          
          // If image is very large or from certain sources, try to clean it
          if (metadata.width > 2000 || metadata.height > 2000 || 
              imageUrl.includes('shutterstock') || imageUrl.includes('getty')) {
            console.log(`   🧹 Attempting to clean/resize image...`);
            await attemptWatermarkRemoval(imagePath);
            processedCount++;
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
      console.log(`   ⚠️  No image found`);
      failCount++;
    }
    
    await page.waitForTimeout(1500);
  }
  
  await browser.close();
  
  console.log('\n📊 Final Results:');
  console.log(`✅ Downloaded: ${successCount} images`);
  console.log(`🧹 Processed: ${processedCount} images (resized/cleaned)`);
  console.log(`❌ Failed: ${failCount} images`);
  
  // List all images with sizes
  console.log('\n📁 All Product Images:');
  const files = fs.readdirSync(imagesDir)
    .filter(f => f.endsWith('.jpg') && !f.includes('placeholder'))
    .sort();
  
  for (const file of files) {
    const stats = fs.statSync(path.join(imagesDir, file));
    const sizeKB = (stats.size / 1024).toFixed(0);
    const metadata = await sharp(path.join(imagesDir, file)).metadata().catch(() => null);
    
    if (metadata) {
      console.log(`   ${file.padEnd(30)} ${sizeKB.padStart(6)}KB  ${metadata.width}x${metadata.height}`);
    } else {
      console.log(`   ${file.padEnd(30)} ${sizeKB.padStart(6)}KB`);
    }
  }
  
  console.log(`\n✨ Total images: ${files.length}`);
}

searchAllImagesFlexible().catch(console.error);