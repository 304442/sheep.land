# CLAUDE.md - Development Guide

This file provides guidance to Claude Code (claude.ai/code) when working with this **production-ready** repository.

## Project Overview

**Sheep Land Egypt** - A production-ready e-commerce platform for livestock and meat products in Egypt, specializing in:
- Live sheep sales and livestock management
- Udheya (Islamic sacrifice) services with religious compliance
- Fresh meat products and butchery services
- Event catering and gathering packages
- Integrated farm management system
- Financial feasibility calculator

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
./pocketbase superuser create <email> <pass> # Create admin

# Testing
npm install && npx playwright test
```

## Directory Structure

```
sheep.land/                     # 🏗️ Production-ready repository
├── backend/                    # 🔧 PocketBase API server
│   ├── pocketbase             # PocketBase v0.28.4 executable
│   ├── pb_hooks/              # Server-side business logic
│   │   ├── main.pb.js         # Order processing & validation
│   │   ├── promo_validation.pb.js # Promo code system
│   │   ├── audit_logging.pb.js    # Audit trail
│   │   ├── rate_limiting.pb.js    # API protection
│   │   ├── security.pb.js         # Security middleware
│   │   └── validation_helpers.pb.js # Egyptian market validation
│   ├── pb_migrations/         # Database schema & seed data
│   ├── start.sh               # Development script
│   └── start-production.sh    # Production script
├── frontend/                   # 🎨 Static web application
│   ├── index.html             # Main e-commerce interface
│   ├── app.js                 # Alpine.js reactive components
│   ├── archive_admin/         # Farm management tools
│   │   ├── management/        # Farm management system (integrated)
│   │   └── feasibility/       # Feasibility calculator (integrated)
│   └── pocketbase.umd.js      # PocketBase SDK
└── tests/                      # 📚 E2E tests
```

## Key Components

### Backend (`/backend/`)
- **`pb_hooks/main.pb.js`** - Order processing, validation, email notifications
- **`pb_hooks/promo_validation.pb.js`** - Discount code validation with usage limits
- **`pb_hooks/audit_logging.pb.js`** - Tracks admin actions and sensitive operations
- **`pb_hooks/rate_limiting.pb.js`** - Protects API from abuse (5 orders/min)
- **`pb_migrations/`** - Complete schema with 13+ products seed data

### Frontend (`/frontend/`)
- **`app.js`** - Main e-commerce application with Alpine.js
- **`index.html`** - Responsive interface (Arabic/English)
- **Farm Management** - Integrated as admin modal
- **Feasibility Calculator** - Integrated as admin modal

## Database Collections

### Core Collections
- **users** - Customer accounts with `is_admin` field
- **products** - Livestock & meat products with image support
- **orders** - Complete order lifecycle with delivery tracking
- **settings** - App configuration, SMTP, payment details

### Farm Management Collections
- **farm_sheep** - Livestock tracking with health status
- **feed_inventory** - Feed stock management
- **health_records** - Medical history tracking
- **financial_transactions** - Farm accounting
- **feasibility_analyses** - Saved business plans

### Supporting Collections
- **promo_codes** - Discount management system
- **email_templates** - Multilingual notifications
- **audit_logs** - Security audit trail

## Development Patterns

### PocketBase Migrations (JavaScript)
```javascript
migrate((app) => {
    // Use 'app' not 'db' as parameter
    const collection = new Collection({
        name: "products",
        type: "base",
        fields: [  // Use 'fields' not 'schema'
            {
                name: "item_key",
                type: "text",
                required: true,
                min: 1,
                max: 100
            }
        ]
    });
    app.save(collection);
});
```

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

## Admin Access

- **Email**: admin@sheep.land
- **Password**: admin@sheep2024
- **Features**: Farm Management & Feasibility Calculator modals

## Production Features

- **🚀 Zero-setup deployment**: Automated database initialization
- **⚡ Real-time updates**: PocketBase subscriptions
- **🔐 Security**: Rate limiting, audit logging, admin authentication
- **🌐 Arabic-first**: Complete RTL support with cultural considerations
- **📦 Inventory**: Real-time stock tracking for livestock
- **📧 Notifications**: Email templates with SMTP support
- **💰 Payments**: Multiple methods ready for gateway integration
- **📱 Mobile**: Responsive design for Egyptian mobile users
- **🏷️ Promo Codes**: Full discount system with validation
- **📦 Delivery Tracking**: Order logistics management

## Important Fixes Applied

1. **Collection Schema Fix**: Changed from `importCollectionsByMarshaledJSON` to `new Collection()` API
2. **Field Definition**: Use `fields` array, not `schema` in migrations
3. **Farm Collections**: Renamed to match actual usage (farm_sheep, feed_inventory, etc.)
4. **Admin Security**: Double-layer protection for admin features
5. **Rate Limiting**: Implemented to prevent API abuse
6. **Audit Logging**: Track all sensitive operations

## Business Logic

### Order Processing Flow
1. **Validation** - Phone, email, delivery area checks
2. **Inventory** - Stock availability verification
3. **Pricing** - Service fees, delivery, promo codes
4. **Confirmation** - Email notification with WhatsApp link
5. **Tracking** - Status updates and delivery info

### Admin Features
- **Farm Management Modal** - Complete livestock tracking
- **Feasibility Calculator Modal** - ROI and project planning
- Both require `is_admin = true` user flag

## Deployment Checklist

- ✅ Database migrations run automatically
- ✅ Admin user created
- ✅ Products seeded
- ⚠️ Configure SMTP settings
- ⚠️ Set up payment gateway
- ⚠️ Configure domain/SSL
- ⚠️ Set up image CDN
- ⚠️ Configure WhatsApp API (optional)

## Important Notes

- **No build process**: Edit `/frontend/` files directly - served as-is
- **Alpine.js**: All interactivity uses Alpine.js reactive patterns
- **Arabic priority**: RTL layout with proper Arabic typography
- **Egyptian market**: Localized for Egyptian culture and business practices
- **Production logs**: Console statements used for monitoring (keep them)
- **Modal Integration**: Farm & Feasibility tools are modals, not separate pages

## Security Considerations

- Rate limiting: 5 orders/min, 10 auth/min, 100 general/min
- Audit logging for admin actions
- Promo code validation with usage tracking
- Admin-only modal access with double checks
- Input validation for Egyptian phone/email formats

## Access Points
- **Application**: http://localhost:8090/
- **Admin Dashboard**: http://localhost:8090/_/
- **API**: http://localhost:8090/api/

See `PROJECT_STATUS.md` for detailed feature status and roadmap.