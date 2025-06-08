# Tools Directory

This directory contains build tools and utilities for the sheep.land e-commerce project.

## Structure

```
tools/
├── build/
│   └── optimize.js         # Build optimization tool (minification, compression)
├── pocketbase/
│   ├── collections-schema.js   # Collection definitions (source of truth)
│   ├── seed-data.js           # Seed data definitions (source of truth)
│   ├── generate-setup.js      # Generate setup.html from schema files
│   ├── extract-pb-schema.js   # Extract PocketBase schema from setup.html (legacy)
│   ├── pb-validator.js        # Validate, lint, and fix PocketBase schemas
│   ├── pb-collections.json    # Extracted collections schema (generated)
│   └── pb-seed.json          # Extracted seed data (generated)
└── README.md              # This file
```

## Available Scripts

### Build Tools
- `npm run build` - Run build optimization
- `npm run build:prod` - Run production build with optimizations
- `npm run clean` - Clean build artifacts
- `npm run help` - Show build tool help

### Setup Management
- `npm run setup:generate` - Generate setup.html from schema files (recommended workflow)

### PocketBase Tools
- `npm run pb:extract` - Extract schema from setup.html to JSON files (legacy)
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

### Setup Management (Recommended Workflow)
The new unified workflow where schema files are the single source of truth:

```bash
# 1. Edit schema files in tools/pocketbase/
#    - collections-schema.js (collection definitions)
#    - seed-data.js (initial data)

# 2. Generate setup.html from schema files
npm run setup:generate

# 3. Validate the schema
npm run pb:validate

# 4. Check for best practices
npm run pb:lint
```

### PocketBase Schema Management (Legacy)
For working with existing setup.html files:

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

### pocketbase/collections-schema.js
**Source of truth** for PocketBase collection definitions. Defines all collections, fields, constraints, rules, and indexes in a clean JavaScript module format.

### pocketbase/seed-data.js  
**Source of truth** for initial seed data. Contains settings, products, and other initial data with dynamic functions for timestamps and references.

### pocketbase/generate-setup.js
**Primary tool** that generates `public/setup.html` by injecting schema definitions from the source files. This eliminates duplication and makes schema files the single source of truth.

### pocketbase/extract-pb-schema.js (Legacy)
Extracts PocketBase collections and seed data from `public/setup.html` into JSON files. Used for migrating existing setups to the new schema-driven workflow.

### pocketbase/pb-validator.js
Comprehensive PocketBase schema validator that checks:
- Field type constraints and limits
- Collection naming conventions
- API rule syntax validation
- Auth collection configuration
- Data integrity and relationships
- Best practices compliance

Generated JSON files (`pb-collections.json`, `pb-seed.json`) are used by the validator and can be version controlled to track schema changes.

## Migration Benefits

The new structure eliminates redundancy by making `tools/pocketbase/` the single source of truth:
- **Before**: Schema duplicated in setup.html + extracted JSON files
- **After**: Schema lives in clean JavaScript modules, setup.html is generated
- **Benefits**: No duplication, easier editing, version control friendly, validation at source