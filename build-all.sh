#!/bin/bash

# Sheep.land Comprehensive Build Script
# This script minifies all assets and creates production-ready files

echo "🐑 Sheep.land Build System"
echo "========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Parse arguments
PRODUCTION=false
CLEAN=false

for arg in "$@"
do
    case $arg in
        --production|-p)
            PRODUCTION=true
            shift
            ;;
        --clean|-c)
            CLEAN=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./build-all.sh [options]"
            echo ""
            echo "Options:"
            echo "  --production, -p    Build for production (removes console.log, etc.)"
            echo "  --clean, -c         Clean dist directory before building"
            echo "  --help, -h          Show this help message"
            exit 0
            ;;
    esac
done

# Clean if requested
if [ "$CLEAN" = true ]; then
    echo -e "${BLUE}🧹 Cleaning dist directory...${NC}"
    rm -rf dist
    echo ""
fi

# Start timer
start_time=$(date +%s)

echo -e "${BLUE}🚀 Starting build process...${NC}"
echo ""

# 1. Minify CSS
echo -e "${BLUE}📘 Minifying CSS...${NC}"
node minify-css-advanced.js
echo ""

# 2. Minify JavaScript
echo -e "${BLUE}📗 Minifying JavaScript...${NC}"
if [ "$PRODUCTION" = true ]; then
    node minify-js-advanced.js --production
else
    node minify-js-advanced.js
fi
echo ""

# 3. Minify HTML
echo -e "${BLUE}📙 Minifying HTML...${NC}"
node minify-html-advanced.js
echo ""

# 4. Process vendor files
echo -e "${BLUE}📦 Processing vendor files...${NC}"
node combine-vendor.js
echo ""

# 5. Run main build process
echo -e "${BLUE}🏗️  Running main build...${NC}"
if [ "$PRODUCTION" = true ]; then
    node build.js --production
else
    node build.js
fi

# Calculate total time
end_time=$(date +%s)
duration=$((end_time - start_time))

echo ""
echo -e "${GREEN}✨ Build completed in ${duration} seconds!${NC}"
echo ""

# Show summary
echo -e "${BLUE}📊 Build Summary:${NC}"
echo "  • CSS minified: public/styles.min.css"
echo "  • JS minified: public/app.min.js"
echo "  • HTML minified: public/*.min.html"
echo "  • Vendor bundle: public/vendor/vendor.bundle.min.js"
echo "  • Distribution: dist/"

if [ "$PRODUCTION" = true ]; then
    echo ""
    echo -e "${GREEN}🚀 Production build complete!${NC}"
    echo "  • Console statements removed"
    echo "  • Maximum compression applied"
    echo "  • Images optimized"
fi

echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  1. Test the minified files locally"
echo "  2. Deploy the 'dist' folder to production"
echo "  3. Update your HTML to use .min.js and .min.css files"

# Make the script executable
chmod +x build-all.sh