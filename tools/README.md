# Tools Directory

This directory contains build tools and utilities for the sheep.land e-commerce project.

## Structure

```
tools/
├── build/
│   └── optimize.js         # Build optimization tool (minification, compression)
├── pocketbase/
│   ├── extract-pb-schema.js    # Extract PocketBase schema from setup.html
│   ├── pb-validator.js         # Validate, lint, and fix PocketBase schemas
│   ├── pb-collections.json     # Extracted collections schema (generated)
│   └── pb-seed.json           # Extracted seed data (generated)
└── README.md              # This file
```

## Available Scripts

### Build Tools
- `npm run build` - Run build optimization
- `npm run build:prod` - Run production build with optimizations
- `npm run clean` - Clean build artifacts
- `npm run help` - Show build tool help

### PocketBase Tools
- `npm run pb:extract` - Extract schema from setup.html to JSON files
- `npm run pb:validate` - Validate PocketBase schema against API constraints
- `npm run pb:lint` - Check for best practices and naming conventions
- `npm run pb:fix` - Apply automatic fixes to schema issues
- `npm run pb:all` - Run all PocketBase validations with verbose output
- `npm run pb:help` - Show PocketBase validator help

## Tool Usage

### Build Optimization
The build optimizer provides minification, compression analysis, and asset optimization:

```bash
npm run build              # Standard build
npm run build:prod         # Production build with advanced optimizations
```

### PocketBase Schema Management
Complete workflow for managing PocketBase schemas:

```bash
# 1. Extract current schema from setup.html
npm run pb:extract

# 2. Validate the extracted schema
npm run pb:validate

# 3. Check for best practices
npm run pb:lint

# 4. Apply automatic fixes if needed
npm run pb:fix

# Or run everything at once
npm run pb:all
```

### PocketBase Validator Features
- **Validate**: Check schema against PocketBase API constraints
- **Lint**: Verify naming conventions and best practices
- **Fix**: Automatically resolve common issues
- **Reports**: Detailed console or JSON output

## File Descriptions

### build/optimize.js
Build optimization tool that provides:
- HTML, CSS, and JavaScript minification
- Image optimization (JPEG, PNG, SVG)
- File size analysis and compression ratios
- Clean dist directory management

### pocketbase/extract-pb-schema.js
Extracts PocketBase collections and seed data from `public/setup.html` into JSON files for validation and management.

### pocketbase/pb-validator.js
Comprehensive PocketBase schema validator that checks:
- Field type constraints and limits
- Collection naming conventions
- API rule syntax validation
- Auth collection configuration
- Data integrity and relationships
- Best practices compliance

Generated JSON files (`pb-collections.json`, `pb-seed.json`) are used by the validator and can be version controlled to track schema changes.