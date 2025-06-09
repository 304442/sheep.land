const { chromium } = require('playwright');
const fs = require('fs');

async function extractLogos() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    const logos = [
        {
            name: 'vodafone-cash',
            url: 'https://web.vodafone.com.eg/en/vodafone-cash',
            selector: 'img[alt*="Vodafone"], .logo, [class*="logo"]'
        },
        {
            name: 'instapay',
            url: 'https://www.instapay.eg',
            selector: 'img[alt*="InstaPay"], .logo, [class*="logo"]'
        },
        {
            name: 'fawry',
            url: 'https://www.fawry.com',
            selector: 'img[alt*="Fawry"], .logo, [class*="logo"]'
        },
        {
            name: 'revolut',
            url: 'https://www.revolut.com',
            selector: 'img[alt*="Revolut"], .logo, [class*="logo"]'
        },
        {
            name: 'monzo',
            url: 'https://monzo.com',
            selector: 'img[alt*="Monzo"], .logo, [class*="logo"]'
        }
    ];

    for (const logo of logos) {
        try {
            console.log(`Extracting ${logo.name}...`);
            await page.goto(logo.url, { waitUntil: 'networkidle' });
            
            // Wait for logo to load
            await page.waitForSelector(logo.selector, { timeout: 10000 }).catch(() => {});
            
            // Try to extract SVG logos
            const svgElements = await page.$$eval('svg', svgs => 
                svgs.map(svg => ({
                    outerHTML: svg.outerHTML,
                    className: svg.className.baseVal || svg.className,
                    width: svg.getAttribute('width'),
                    height: svg.getAttribute('height')
                }))
            );

            if (svgElements.length > 0) {
                fs.writeFileSync(
                    `./extracted-${logo.name}.json`, 
                    JSON.stringify(svgElements, null, 2)
                );
                console.log(`Found ${svgElements.length} SVG elements for ${logo.name}`);
            }

            // Screenshot the logo area
            const logoElement = await page.$(logo.selector).catch(() => null);
            if (logoElement) {
                await logoElement.screenshot({ 
                    path: `./extracted-${logo.name}.png`,
                    type: 'png'
                });
                console.log(`Screenshot saved for ${logo.name}`);
            }

            // Extract colors from computed styles
            const colors = await page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                const foundColors = new Set();
                
                for (const el of elements) {
                    const styles = window.getComputedStyle(el);
                    ['backgroundColor', 'color', 'borderColor', 'fill', 'stroke'].forEach(prop => {
                        const value = styles[prop];
                        if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
                            foundColors.add(value);
                        }
                    });
                }
                
                return Array.from(foundColors);
            });

            fs.writeFileSync(
                `./colors-${logo.name}.json`, 
                JSON.stringify(colors, null, 2)
            );

        } catch (error) {
            console.error(`Error extracting ${logo.name}:`, error.message);
        }
    }

    await browser.close();
    console.log('Logo extraction complete!');
}

extractLogos().catch(console.error);