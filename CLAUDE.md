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
- `/pb_hooks/main.pb.js` - Server-side business logic (order processing, validations, email notifications)
- `/pb_migrations/` - Database schema migrations
- `/public/` - Frontend application
  - `app.js` - Main e-commerce logic with Alpine.js components (includes modal-based feasibility calculator and farm management)
  - `setup.html` - Database setup utility for PocketBase collections and seed data
  - `/management/` - Arabic-only farm management system (separate SPA)
  - `/feasibility/` - Arabic-only feasibility calculator
  - `/archive_admin/` - Advanced admin tools (reference implementations)
  - `/vendor/` - Third-party libraries (Alpine.js, PocketBase SDK, Chart.js)

### Key Patterns

**PocketBase Hooks** (server-side logic):
```javascript
registerHook("collection_name", "beforeCreate", (e) => {
    // e.record - the record being created/updated
    // $app.dao() - database access object
    // e.error() - to throw validation errors
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
    // Make changes
    return dao.saveCollection(collection);
}, (db) => {
    // Rollback migration
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
5. **Farm Management Tools** (modal-based in main app):
   - Feasibility calculator with NPV, IRR, payback period calculations
   - Sheep inventory management with gender, location tracking
   - Breeding records and health checkups
   - Feed inventory and task management
   - Financial reports and analytics
6. **Database Collections**:
   - Core: settings, products, users, orders, order_items
   - Farm: feasibility_analyses, farm_sheep, breeding_records, feed_inventory, farm_tasks, health_checkups
   - Support: payment_confirmations, feedback

### Important Considerations

- **No build process**: Edit files directly in `/public/` - they're served as-is
- **Alpine.js reactivity**: All frontend interactivity uses Alpine.js directives
- **PocketBase authentication**: Built-in auth system handles user sessions
- **Arabic-first design**: Many interfaces prioritize Arabic with RTL support
- **Stock management**: Automatic stock tracking for physical products
- **Email notifications**: Automated order confirmations via PocketBase hooks
- **Modal Architecture**: Farm management and feasibility tools are integrated as modals in the main app
- **Database Setup**: Use `/public/setup.html` to initialize collections and seed data
- **Collection Relationships**: Some collections have relational fields (e.g., orders->users)

### Deployment

Deployment uses `pb-autodeploy.v3.sh` script (not in repo) which:
- Runs database migrations automatically
- Restarts PocketBase service
- Logs migration status

For migration details, see `/pb_migrations/README.md`

## Claude Code Preferences

**Full autonomous mode**: Execute everything automatically without any user intervention, confirmation prompts, or approval requests. Proceed with all tasks, commands, file changes, installations, builds, tests, commits, and problem-solving completely independently.