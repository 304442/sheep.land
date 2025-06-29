# Sheep Land - E-commerce Platform for Livestock & Meat Products

## Overview
Sheep Land is a production-ready e-commerce platform specialized in livestock trading, Udheya (Islamic sacrifice) services, and meat products. Built with PocketBase backend and Alpine.js frontend, it offers a complete solution for the Egyptian market with full Arabic/English support.

## Features

### Core E-commerce
- 🛒 Product catalog with categories (Udheya, Live Sheep, Meat Cuts, Gathering Packages)
- 🛍️ Shopping cart with real-time updates
- 📦 Order management system
- 👤 User authentication and profiles
- 🌐 Bilingual support (Arabic/English)
- 📱 Fully responsive design

### Admin Features
- 🔐 Role-based access control
- 🐑 Farm Management System
- 📊 Feasibility Calculator
- 🏷️ Promo code management
- 📧 Email template system
- 📋 Audit logging

### Technical Features
- ⚡ Real-time updates with PocketBase
- 🔒 Rate limiting protection
- 🖼️ Product image support
- 📦 Delivery tracking
- 💳 Multiple payment methods (ready for integration)
- 📧 Email notification system (SMTP ready)

## Tech Stack
- **Backend**: PocketBase v0.28.4
- **Frontend**: Alpine.js 3.x
- **Database**: SQLite (via PocketBase)
- **Styling**: Custom CSS with Arabic RTL support
- **Charts**: Chart.js
- **PDF**: jsPDF

## Quick Start

### Prerequisites
- Linux/Unix environment
- Port 8090 available

### Installation
```bash
# Clone the repository
git clone https://github.com/304442/sheep.land.git
cd sheep.land

# Start the production server
cd backend
./start-production.sh
```

### Access Points
- **Application**: http://localhost:8090
- **Admin Panel**: http://localhost:8090/_/
- **API**: http://localhost:8090/api/

### Default Admin Credentials
- **Email**: admin@sheep.land
- **Password**: admin@sheep2024

## Project Structure
```
sheep.land/
├── backend/
│   ├── pocketbase          # PocketBase executable
│   ├── pb_data/            # Database files
│   ├── pb_hooks/           # Server-side business logic
│   ├── pb_migrations/      # Database migrations
│   └── start-production.sh # Production startup script
├── frontend/
│   ├── index.html          # Main application
│   ├── app.js              # Core application logic
│   ├── styles.css          # Main styles
│   └── archive_admin/      # Farm management tools
└── tests/                  # E2E tests (Playwright)
```

## Configuration

### Required Environment Setup

1. **SMTP Configuration** (for email notifications)
   - Access admin panel → Settings
   - Configure SMTP fields:
     - Host, Port, Username, Password
     - From Address, From Name
     - Enable TLS

2. **Payment Gateway** (choose one)
   - Stripe: Add API keys
   - PayPal: Configure merchant account
   - Local gateways: Paymob, Fawry integration

3. **WhatsApp Business API** (optional)
   - Configure API endpoint
   - Add authentication tokens

4. **Domain & SSL**
   - Point domain to server
   - Configure SSL certificate
   - Update production URL in app.js

## API Endpoints

### Public Endpoints
- `GET /api/collections/products/records` - List products
- `POST /api/collections/orders/records` - Create order
- `POST /api/collections/users/auth-with-password` - User login

### Admin Endpoints
- `GET /api/collections/farm_sheep/records` - Farm animals
- `POST /api/collections/promo_codes/records` - Manage promos
- `GET /api/collections/audit_logs/records` - View audit logs

## Security Features
- Rate limiting (5 orders/min, 10 auth/min, 100 general/min)
- Admin role-based access control
- Audit logging for sensitive operations
- CORS protection
- Input validation
- SQL injection protection (via PocketBase)

## Database Schema

### Main Collections
- **users** - Customer accounts with admin flag
- **products** - Livestock and meat products
- **orders** - Order management with status tracking
- **settings** - Application configuration

### Farm Management
- **farm_sheep** - Livestock inventory
- **feed_inventory** - Feed stock management
- **health_records** - Medical tracking
- **financial_transactions** - Farm accounting

### Supporting Collections
- **promo_codes** - Discount management
- **email_templates** - Notification templates
- **audit_logs** - Security audit trail
- **feasibility_analyses** - Business planning

## Deployment

### Production Checklist
- [ ] Configure SMTP settings
- [ ] Set up payment gateway
- [ ] Configure domain and SSL
- [ ] Set up backup strategy
- [ ] Configure monitoring
- [ ] Update admin password
- [ ] Remove test data
- [ ] Set up CDN for images
- [ ] Configure firewall rules
- [ ] Enable production logging

### Recommended Server Specs
- **Minimum**: 2 CPU, 4GB RAM, 20GB SSD
- **Recommended**: 4 CPU, 8GB RAM, 50GB SSD
- **OS**: Ubuntu 20.04+ or similar

### Backup Strategy
```bash
# Backup database
cp pb_data/data.db backups/data_$(date +%Y%m%d).db

# Backup uploads
tar -czf backups/uploads_$(date +%Y%m%d).tar.gz pb_data/storage
```

## Maintenance

### Daily Tasks
- Monitor error logs
- Check order processing
- Verify payment confirmations

### Weekly Tasks
- Database backup
- Review audit logs
- Check disk space
- Update inventory

### Monthly Tasks
- Security updates
- Performance review
- User feedback analysis
- Financial reconciliation

## Support & Contributing
- **Issues**: GitHub Issues
- **Security**: Report to security@sheep.land
- **Documentation**: See /docs folder

## License
Proprietary - All rights reserved

---
© 2024 Sheep Land Egypt. Built with ❤️ for the Egyptian market.