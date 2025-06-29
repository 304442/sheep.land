# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this **production-ready** repository.

## Project Overview

**Sheep Land Egypt** - A production-ready e-commerce platform for livestock and meat products in Egypt, specializing in:
- Live sheep sales and livestock management
- Udheya (Islamic sacrifice) services with religious compliance
- Fresh meat products and butchery services
- Event catering and gathering packages

## Technology Stack

- **Backend**: PocketBase v0.28.4 (self-hosted BaaS)
- **Frontend**: HTML/CSS/JavaScript with Alpine.js
- **Database**: SQLite with automated migrations
- **Architecture**: Clean backend/frontend separation
- **No build tools**: Static files served directly (production-ready)

## Quick Commands

```bash
# Production deployment
cd backend && ./start-production.sh

# Development mode
cd backend && ./start.sh

# Database management
cd backend
./pocketbase migrate up                     # Apply migrations
./pocketbase migrate create <name>          # Create migration
./pocketbase superuser upsert <email> <pass> # Create admin

# Testing
npm install && npx playwright test
```

## Directory Structure

```
sheep.land/                     # 🏗️ Production-ready repository
├── backend/                    # 🔧 PocketBase API server
│   ├── pocketbase             # PocketBase v0.28.4 executable
│   ├── pb_hooks/              # Server-side business logic
│   ├── pb_migrations/         # Database schema & seed data
│   ├── start.sh               # Development script
│   └── start-production.sh    # Production script
├── frontend/                   # 🎨 Static web application
│   ├── index.html             # Main e-commerce interface
│   ├── app.js                 # Alpine.js reactive components
│   ├── archive_admin/         # Farm management tools
│   └── vendor/                # Third-party libraries
└── docs/                      # 📚 Documentation
```

## Key Components

### Backend (`/backend/`)
- **`pb_hooks/main.pb.js`** - Order processing, validation, email notifications
- **`pb_hooks/validation_helpers.pb.js`** - Egyptian market validation
- **`pb_hooks/security.pb.js`** - Security middleware
- **`pb_migrations/`** - Complete schema with 13+ products seed data

### Frontend (`/frontend/`)
- **`app.js`** - Main e-commerce application with Alpine.js
- **`index.html`** - Responsive interface (Arabic/English)
- **`archive_admin/management/`** - Farm management system (Arabic)
- **`archive_admin/feasibility/`** - Business calculator
- **`vendor/`** - Alpine.js, PocketBase SDK

## Development Patterns

### PocketBase Hooks (Latest API)
```javascript
onRecordCreateRequest((e) => {
    if (e.collection.name !== "orders") return;
    
    // Access fields
    const fieldValue = e.record.get("field_name");
    
    // Validation
    if (!fieldValue) {
        throw new BadRequestError("Field required");
    }
    
    // Save related records
    $app.dao().save(otherRecord);
});

// Email notifications
const message = new MailerMessage({
    from: { address: "orders@sheep.land", name: "Sheep Land" },
    to: [{ address: customerEmail }],
    subject: "Order Confirmation",
    html: htmlContent
});
$mails.send(message);
```

### Frontend Components (Alpine.js)
```javascript
Alpine.data('productCatalog', () => ({
    products: [],
    loading: false,
    
    async loadProducts() {
        this.loading = true;
        try {
            const records = await pb.collection('products').getList();
            this.products = records.items;
        } finally {
            this.loading = false;
        }
    }
}));
```

## Production Features

- **🚀 Zero-setup deployment**: Automated database initialization
- **⚡ Real-time updates**: PocketBase subscriptions
- **🔐 Security**: Production-grade authentication & validation
- **🌐 Arabic-first**: Complete RTL support with cultural considerations
- **📦 Inventory**: Real-time stock tracking for livestock
- **📧 Notifications**: Automated order confirmations
- **💰 Payments**: COD, bank transfer, e-wallets, crypto
- **📱 Mobile**: Responsive design for Egyptian mobile users

## Business Logic

### Core Collections
- **Users** - Customer accounts with Egyptian phone validation
- **Products** - Livestock, meat cuts, catering packages (13+ items)
- **Orders** - Complete order lifecycle with status tracking
- **Settings** - App configuration, delivery areas, payment details

### Key Workflows
1. **Product Browsing** - Category filtering, search, detailed views
2. **Order Processing** - Cart management, checkout, validation
3. **Payment Handling** - Multiple methods, confirmation emails
4. **Inventory Management** - Stock tracking, availability updates
5. **Customer Management** - Accounts, order history, preferences

## Important Notes

- **No build process**: Edit `/frontend/` files directly - served as-is
- **Alpine.js**: All interactivity uses Alpine.js reactive patterns
- **Arabic priority**: RTL layout with proper Arabic typography
- **Egyptian market**: Localized for Egyptian culture and business practices
- **Production logs**: Console statements used for monitoring (keep them)

## Deployment Status

**✅ PRODUCTION READY** - The platform is fully optimized and ready for immediate deployment.

### Access Points
- **Application**: http://localhost:8090/
- **Admin Dashboard**: http://localhost:8090/_/
- **API**: http://localhost:8090/api/

See `DEPLOYMENT.md` for complete production deployment guide.