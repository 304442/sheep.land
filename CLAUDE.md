# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack e-commerce web application for a sheep farming business in Egypt, specializing in:
- Live sheep sales
- Udheya (Islamic sacrifice) services  
- Fresh meat products
- Event catering services

## Technology Stack

- **Backend**: PocketBase (self-hosted BaaS)
- **Frontend**: HTML/CSS/JavaScript with Alpine.js for reactivity
- **Database**: SQLite (via PocketBase)
- **Testing**: Playwright (installed but no tests implemented yet)
- **No build tools**: Static files served directly

## Common Development Commands

```bash
# Install dependencies (mainly for testing)
npm install

# Run PocketBase locally
# Download PocketBase binary first from https://pocketbase.io/docs/
./pocketbase serve

# Access points during local development:
# Main app: http://localhost:8090
# Admin UI: http://localhost:8090/_/
# API: http://localhost:8090/api/

# Run Playwright tests (when implemented)
npx playwright test

# Create a new database migration
# Use format: pb_migrations/[timestamp]_[description].js
# Example: pb_migrations/1704067200_add_new_field.js
```

## Architecture

### Directory Structure
- `/pb_hooks/` - Server-side business logic
  - `main.pb.js` - Order processing, validations, email notifications (Updated to latest PocketBase API)
  - `validation_helpers.pb.js` - Reusable validation functions
- `/pb_migrations/` - Database schema migrations
  - Example migrations included for adding fields, creating collections, and data migrations
- `/public/` - Frontend application
  - `app.js` - Main e-commerce logic with Alpine.js components
  - `/management/` - Arabic-only farm management system (separate SPA)
  - `/feasibility/` - Arabic-only feasibility calculator
  - `/vendor/` - Third-party libraries (Alpine.js, PocketBase SDK, Chart.js)

### Key Patterns

**PocketBase Hooks** (server-side logic - Updated to latest API):
```javascript
// Hook registration (no wrapper function needed)
onRecordBeforeCreateRequest((e) => {
    if (e.collection.name !== "collection_name") return;
    
    // e.record - the record being created/updated
    // e.requestInfo - request context (auth, IP, etc.)
    // throw new BadRequestError("message") - for validation errors
    
    // Access fields
    const fieldValue = e.record.get("field_name");
    
    // Set fields
    e.record.set("field_name", value);
    
    // Save other records
    $app.save(otherRecord);
});

// Email sending
$app.sendMail({
    from: { address: "noreply@example.com", name: "App Name" },
    to: [{ address: "user@example.com" }],
    subject: "Subject",
    html: "<p>HTML content</p>"
});
```

**Frontend Components** (Alpine.js):
```javascript
Alpine.data('componentName', () => ({
    // State
    property: value,
    
    // Methods
    async method() {
        // Use pb (PocketBase SDK) for API calls
    }
}));
```

**Database Migrations**:
```javascript
migrate((db) => {
    // Forward migration
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("collection_name");
    
    // Add fields
    collection.schema.addField(new SchemaField({
        "name": "field_name",
        "type": "text",
        "required": true,
        "options": { "min": 1, "max": 200 }
    }));
    
    return dao.saveCollection(collection);
}, (db) => {
    // Rollback migration
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("collection_name");
    collection.schema.removeField("field_name");
    return dao.saveCollection(collection);
});
```

### Business Logic Overview

1. **Order System**: Complex order processing with stock management, multiple payment methods, and email confirmations
2. **Multi-language**: Arabic and English support throughout the application
3. **Payment Methods**: Cash, bank transfer, Instapay, Vodafone Cash, crypto (USDT)
4. **Product Types**: 
   - Udheya services (with special Islamic requirements)
   - Live sheep
   - Meat cuts (various types)
   - Catering packages

### Important Considerations

- **No build process**: Edit files directly in `/public/` - they're served as-is
- **Alpine.js reactivity**: All frontend interactivity uses Alpine.js directives
- **PocketBase authentication**: Built-in auth system handles user sessions
- **Arabic-first design**: Many interfaces prioritize Arabic with RTL support
- **Stock management**: Automatic stock tracking for physical products
- **Email notifications**: Automated order confirmations via PocketBase hooks

### Deployment

Deployment uses `pb-autodeploy.v3.sh` script (not in repo) which:
- Runs database migrations automatically
- Restarts PocketBase service
- Logs migration status

For migration details, see `/pb_migrations/README.md`

### Recent Updates (PocketBase API Migration)

The codebase has been updated to use the latest PocketBase API:

1. **Hooks API Changes**:
   - Direct hook registration without wrapper functions
   - Updated record field access methods (`.get()` instead of `.getString()`, etc.)
   - New error handling with `BadRequestError`
   - Updated email API using `$app.sendMail()`
   - Direct `$app` methods instead of `dao` pattern

2. **Database Schema Migration**:
   - ✅ **Replaced setup.html** with automated PocketBase migrations
   - ✅ **Initial schema migration** (`1704067200_initial_schema.js`) creates all core collections
   - ✅ **Deployment integration** - migrations run automatically on deploy
   - ❌ **setup.html removal** - pending verification of migration success

3. **Migration System**:
   - Proper version-controlled schema changes
   - Rollback capability for migrations
   - Clean separation of schema and seed data
   - Documentation in `MIGRATION_FROM_SETUP.md`

4. **Validation Improvements**:
   - Separate validation helper functions
   - Egyptian phone number validation
   - Comprehensive order validation
   - HTML sanitization helpers

### Files to Remove After Migration Success:
- `public/setup.html` (50KB+ manual setup interface)
- `extract_seed_data.js` (temporary extraction utility)