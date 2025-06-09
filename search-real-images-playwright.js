const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Product configurations with multiple search strategies
const productSearchConfigs = [
  // Sheep breeds
  {
    filename: 'sheep-baladi.jpg',
    searches: [
      { engine: 'google', query: 'Egyptian Baladi sheep white farm animal' },
      { engine: 'bing', query: 'Baladi sheep breed Egypt livestock' },
      { engine: 'duckduckgo', query: 'white sheep farm animal pastoral' },
      { engine: 'pixabay', query: 'white sheep farm' },
      { engine: 'unsplash', query: 'sheep livestock' }
    ],
    validateImage: ['sheep', 'farm', 'animal']
  },
  {
    filename: 'sheep-barki.jpg',
    searches: [
      { engine: 'google', query: 'Barki sheep desert breed brown tan' },
      { engine: 'bing', query: 'desert sheep breed Middle East' },
      { engine: 'pixabay', query: 'brown sheep desert' },
      { engine: 'pexels', query: 'desert adapted sheep' }
    ],
    validateImage: ['sheep', 'brown', 'desert']
  },
  {
    filename: 'sheep-ram.jpg',
    searches: [
      { engine: 'google', query: 'male ram sheep horns breeding livestock' },
      { engine: 'bing', query: 'ram sheep curved horns male' },
      { engine: 'pixabay', query: 'ram horns sheep' },
      { engine: 'unsplash', query: 'ram male sheep' }
    ],
    validateImage: ['ram', 'horns', 'male']
  },
  {
    filename: 'sheep-ewe.jpg',
    searches: [
      { engine: 'google', query: 'female ewe sheep mother livestock' },
      { engine: 'bing', query: 'ewe female sheep breeding' },
      { engine: 'pixabay', query: 'female sheep ewe' },
      { engine: 'pexels', query: 'mother sheep ewe' }
    ],
    validateImage: ['sheep', 'female', 'ewe']
  },
  {
    filename: 'sheep-lamb.jpg',
    searches: [
      { engine: 'google', query: 'baby lamb young sheep cute 3 months' },
      { engine: 'bing', query: 'young lamb weaned baby sheep' },
      { engine: 'pixabay', query: 'baby lamb cute' },
      { engine: 'unsplash', query: 'young lamb sheep' }
    ],
    validateImage: ['lamb', 'young', 'baby']
  },
  
  // Meat products
  {
    filename: 'lamb-ribs.jpg',
    searches: [
      { engine: 'google', query: 'raw lamb chops ribs rack fresh meat' },
      { engine: 'bing', query: 'lamb rib chops raw butcher' },
      { engine: 'shutterstock', query: 'lamb chops raw meat' },
      { engine: 'getty', query: 'rack of lamb raw' }
    ],
    validateImage: ['lamb', 'ribs', 'meat']
  },
  {
    filename: 'lamb-leg.jpg',
    searches: [
      { engine: 'google', query: 'whole leg of lamb raw meat roast' },
      { engine: 'bing', query: 'lamb leg whole raw butcher' },
      { engine: 'shutterstock', query: 'leg of lamb raw' },
      { engine: 'pixabay', query: 'lamb leg meat' }
    ],
    validateImage: ['lamb', 'leg', 'meat']
  },
  {
    filename: 'lamb-shoulder.jpg',
    searches: [
      { engine: 'google', query: 'lamb shoulder boneless raw meat cut' },
      { engine: 'bing', query: 'boneless lamb shoulder raw' },
      { engine: 'shutterstock', query: 'lamb shoulder meat' },
      { engine: 'getty', query: 'raw lamb shoulder' }
    ],
    validateImage: ['lamb', 'shoulder', 'meat']
  },
  {
    filename: 'lamb-minced.jpg',
    searches: [
      { engine: 'google', query: 'ground lamb mince raw meat fresh' },
      { engine: 'bing', query: 'minced lamb meat ground' },
      { engine: 'shutterstock', query: 'ground lamb meat' },
      { engine: 'pixabay', query: 'minced meat lamb' }
    ],
    validateImage: ['mince', 'ground', 'meat']
  },
  
  // Event gatherings
  {
    filename: 'event-small-gathering.jpg',
    searches: [
      { engine: 'google', query: 'Middle Eastern family dinner feast table' },
      { engine: 'bing', query: 'Arabic family meal traditional food' },
      { engine: 'shutterstock', query: 'Middle Eastern family dinner' },
      { engine: 'unsplash', query: 'family feast table' }
    ],
    validateImage: ['family', 'dinner', 'food']
  },
  {
    filename: 'event-large-gathering.jpg',
    searches: [
      { engine: 'google', query: 'Arabic wedding feast banquet large' },
      { engine: 'bing', query: 'Middle Eastern celebration banquet' },
      { engine: 'shutterstock', query: 'Arabic wedding feast' },
      { engine: 'getty', query: 'large banquet feast' }
    ],
    validateImage: ['feast', 'banquet', 'celebration']
  },
  {
    filename: 'event-catering.jpg',
    searches: [
      { engine: 'google', query: 'Middle Eastern BBQ mixed grill kebab' },
      { engine: 'bing', query: 'Arabic BBQ grill platter kebab' },
      { engine: 'shutterstock', query: 'Middle Eastern BBQ' },
      { engine: 'pixabay', query: 'kebab grill BBQ' }
    ],
    validateImage: ['grill', 'BBQ', 'kebab']
  }
];

// Search engine configurations
const searchEngines = {
  google: {
    url: 'https://www.google.com/search?tbm=isch&q=',
    imageSelector: 'img[jsname="Q4LuWd"]',
    clickToEnlarge: true,
    largeImageSelector: 'img.n3VNCb',
    waitTime: 2000
  },
  bing: {
    url: 'https://www.bing.com/images/search?q=',
    imageSelector: 'img.mimg',
    clickToEnlarge: false,
    waitTime: 2000
  },
  duckduckgo: {
    url: 'https://duckduckgo.com/?iax=images&ia=images&q=',
    imageSelector: 'img.tile--img__img',
    clickToEnlarge: true,
    largeImageSelector: 'img.detail__media__img-highres',
    waitTime: 2000
  },
  pixabay: {
    url: 'https://pixabay.com/images/search/',
    imageSelector: 'img[srcset]',
    clickToEnlarge: false,
    getSrcFromSrcset: true,
    waitTime: 2000
  },
  pexels: {
    url: 'https://www.pexels.com/search/',
    imageSelector: 'img.photo-item__img',
    clickToEnlarge: false,
    getSrcFromSrcset: true,
    waitTime: 2000
  },
  unsplash: {
    url: 'https://unsplash.com/s/photos/',
    imageSelector: 'img[srcset]',
    clickToEnlarge: false,
    getSrcFromSrcset: true,
    waitTime: 2000
  }
};

// Download image from URL
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
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
      reject(new Error('Download timeout'));
    });
  });
}

// Search for image using specific search engine
async function searchWithEngine(page, engineName, query) {
  const engine = searchEngines[engineName];
  if (!engine) {
    console.log(`   Unknown search engine: ${engineName}`);
    return null;
  }
  
  try {
    console.log(`   🔍 Searching ${engineName}: "${query}"`);
    
    const searchUrl = engine.url + encodeURIComponent(query);
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(engine.waitTime);
    
    // Handle cookie consent if present
    try {
      await page.click('button:has-text("Accept")', { timeout: 3000 });
    } catch (e) {
      // No cookie banner
    }
    
    // Get image elements
    const images = await page.$$(engine.imageSelector);
    console.log(`      Found ${images.length} images`);
    
    if (images.length === 0) return null;
    
    // Try to get high quality image URL
    for (let i = 0; i < Math.min(5, images.length); i++) {
      try {
        let imageUrl = null;
        
        if (engine.clickToEnlarge) {
          // Click to get larger image
          await images[i].click();
          await page.waitForTimeout(1500);
          
          const largeImage = await page.$(engine.largeImageSelector);
          if (largeImage) {
            imageUrl = await largeImage.getAttribute('src');
          }
        } else if (engine.getSrcFromSrcset) {
          // Get highest resolution from srcset
          const srcset = await images[i].getAttribute('srcset');
          if (srcset) {
            const sources = srcset.split(',').map(s => s.trim().split(' '));
            const highestRes = sources[sources.length - 1];
            imageUrl = highestRes[0];
          }
        } else {
          // Get direct src
          imageUrl = await images[i].getAttribute('src');
        }
        
        if (imageUrl && imageUrl.startsWith('http') && !imageUrl.includes('base64')) {
          console.log(`      ✓ Found valid image URL`);
          return imageUrl;
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.log(`      ❌ Error: ${error.message}`);
    return null;
  }
}

// Main search function
async function searchAndDownloadRealImages() {
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=site-per-process',
      '--disable-web-security'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  
  const page = await context.newPage();
  
  const imagesDir = path.join(__dirname, 'public', 'images', 'products');
  const backupDir = path.join(imagesDir, 'placeholder-backup');
  
  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  console.log('🐑 Searching for Real Product Images with Playwright\n');
  
  let successCount = 0;
  let failCount = 0;
  const results = [];
  
  for (const config of productSearchConfigs) {
    const imagePath = path.join(imagesDir, config.filename);
    
    console.log(`\n📸 Processing: ${config.filename}`);
    
    // Backup existing placeholder
    if (fs.existsSync(imagePath)) {
      const backupPath = path.join(backupDir, config.filename);
      fs.copyFileSync(imagePath, backupPath);
      console.log(`   📁 Backed up existing placeholder`);
    }
    
    let downloaded = false;
    
    // Try each search configuration
    for (const search of config.searches) {
      if (downloaded) break;
      
      const imageUrl = await searchWithEngine(page, search.engine, search.query);
      
      if (imageUrl) {
        try {
          console.log(`   📥 Downloading image...`);
          await downloadImage(imageUrl, imagePath);
          console.log(`   ✅ Successfully downloaded ${config.filename}`);
          successCount++;
          downloaded = true;
          
          results.push({
            filename: config.filename,
            status: 'success',
            source: search.engine,
            query: search.query
          });
        } catch (err) {
          console.log(`   ❌ Download failed: ${err.message}`);
        }
      }
    }
    
    if (!downloaded) {
      console.log(`   ⚠️  Failed to find suitable image for ${config.filename}`);
      failCount++;
      
      results.push({
        filename: config.filename,
        status: 'failed',
        source: 'none'
      });
    }
    
    // Delay between searches
    await page.waitForTimeout(3000);
  }
  
  // Create visual test page
  console.log('\n📋 Creating test page...');
  
  const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Real Images Search Results</title>
    <style>
        body { font-family: Arial; margin: 20px; background: #f5f5f5; }
        h1 { color: #2C5F41; text-align: center; }
        .summary { 
            background: ${successCount > 0 ? '#d4edda' : '#f8d7da'}; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px;
            text-align: center;
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 20px; 
        }
        .card { 
            background: white; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
        }
        .card img { 
            width: 100%; 
            height: 200px; 
            object-fit: cover; 
        }
        .card-info { 
            padding: 15px; 
        }
        .success { color: #155724; background: #d4edda; }
        .failed { color: #721c24; background: #f8d7da; }
        .status { 
            padding: 5px 10px; 
            border-radius: 4px; 
            font-size: 12px; 
            margin-top: 5px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <h1>🐑 Real Images Search Results</h1>
    
    <div class="summary">
        <h2>Search Summary</h2>
        <p>✅ Success: ${successCount} | ❌ Failed: ${failCount}</p>
    </div>
    
    <div class="grid">
        ${results.map(r => `
            <div class="card">
                <img src="public/images/products/${r.filename}" 
                     alt="${r.filename}"
                     onerror="this.style.background='#f0f0f0'; this.style.padding='20px';">
                <div class="card-info">
                    <strong>${r.filename}</strong>
                    <div class="status ${r.status}">${r.status === 'success' ? '✅ Downloaded' : '❌ Failed'}</div>
                    ${r.status === 'success' ? `<br><small>Source: ${r.source}</small>` : ''}
                </div>
            </div>
        `).join('')}
    </div>
    
    <script>
        // Test image loading
        window.addEventListener('load', () => {
            document.querySelectorAll('img').forEach(img => {
                if (!img.complete || img.naturalHeight === 0) {
                    img.parentElement.querySelector('.status').textContent = '⚠️ Load Error';
                    img.parentElement.querySelector('.status').classList.add('failed');
                }
            });
        });
    </script>
</body>
</html>`;
  
  const testPath = path.join(__dirname, 'real-images-results.html');
  fs.writeFileSync(testPath, testHtml);
  
  // Take screenshot of results
  await page.goto(`file://${testPath}`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'real-images-search-results.png', fullPage: true });
  
  await browser.close();
  
  console.log('\n📊 Final Results:');
  console.log(`✅ Successfully downloaded: ${successCount} real images`);
  console.log(`❌ Failed: ${failCount} images`);
  console.log('\n📄 View results: real-images-results.html');
  console.log('📸 Screenshot saved: real-images-search-results.png');
  
  if (failCount > 0) {
    console.log('\n💡 For failed images, placeholders remain in place');
  }
}

// Run the search
searchAndDownloadRealImages().catch(console.error);