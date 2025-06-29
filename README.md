# 🐑 Sheep Land Egypt - Production E-commerce Platform

A production-ready e-commerce platform for livestock and meat products in Egypt, specializing in live sheep sales, Udheya (Islamic sacrifice) services, fresh meat products, and event catering.

## 🏗️ Architecture

```
sheep.land/
├── backend/          # PocketBase API server
├── frontend/         # Static web application  
└── tests/           # E2E tests (Playwright)
```

### Backend
- **PocketBase v0.28.4** - Self-hosted Backend-as-a-Service
- **SQLite** - Database with automated migrations
- **JavaScript Hooks** - Server-side business logic
- **REST API** - Full CRUD operations

### Frontend  
- **Alpine.js 3.x** - Reactive UI framework
- **Vanilla JS** - No build process required
- **Arabic/English** - Bilingual support with RTL
- **Responsive** - Mobile-first design

## 🚀 Production Deployment

### Quick Start
```bash
# Clone repository
git clone https://github.com/304442/sheep.land.git
cd sheep.land

# Start production server
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

## ✨ Production Features

### 🛒 Core E-commerce
- ✅ Product catalog with 13 pre-seeded products
- ✅ Shopping cart with real-time updates
- ✅ Order management with delivery tracking
- ✅ User authentication and profiles
- ✅ Promo code system with validation
- ✅ Multiple payment methods (ready for integration)

### 🔐 Security & Performance
- ✅ Rate limiting (5 orders/min, 10 auth/min)
- ✅ Audit logging for sensitive operations
- ✅ CORS protection
- ✅ Input validation
- ✅ Admin role-based access control

### 🐑 Business Features
- ✅ Live sheep inventory management
- ✅ Udheya (Islamic sacrifice) services
- ✅ Farm Management System (admin modal)
- ✅ Feasibility Calculator (admin modal)
- ✅ Email notification system (SMTP ready)
- ✅ Delivery tracking system

### 🌐 Localization
- ✅ Arabic-first design with full RTL support
- ✅ English interface
- ✅ Egyptian phone/email validation
- ✅ Cultural and religious considerations

## 📋 Production Checklist

### Required Configuration
- [ ] **SMTP Settings** - Configure email server in admin panel
- [ ] **Payment Gateway** - Add Stripe/PayPal/local gateway credentials
- [ ] **Domain & SSL** - Configure production domain and SSL certificate
- [ ] **Admin Password** - Change default admin password

### Recommended Configuration
- [ ] **Image CDN** - Set up CDN for product images
- [ ] **WhatsApp API** - Configure for order notifications
- [ ] **Backup Strategy** - Set up automated backups
- [ ] **Monitoring** - Configure server monitoring

## 🛠️ Maintenance

### Daily Tasks
```bash
# Check error logs
tail -f pb_data/logs/pocketbase.log

# Monitor orders
# Access admin panel > Orders collection
```

### Backup Commands
```bash
# Backup database
cp pb_data/data.db backups/data_$(date +%Y%m%d).db

# Backup uploads
tar -czf backups/uploads_$(date +%Y%m%d).tar.gz pb_data/storage
```

## 📊 Database Schema

### Core Collections
- **users** - Customer accounts with admin flag
- **products** - Livestock and meat products
- **orders** - Order management with status tracking
- **settings** - Application configuration

### Business Collections
- **farm_sheep** - Livestock inventory
- **health_records** - Medical tracking
- **financial_transactions** - Farm accounting
- **promo_codes** - Discount management
- **audit_logs** - Security audit trail

## 🔧 API Endpoints

### Public Endpoints
- `GET /api/collections/products/records` - List products
- `POST /api/collections/orders/records` - Create order
- `POST /api/collections/users/auth-with-password` - User login

### Admin Endpoints (requires authentication)
- `GET /api/collections/farm_sheep/records` - Farm animals
- `POST /api/collections/promo_codes/records` - Manage promos
- `GET /api/collections/audit_logs/records` - View audit logs

## 📚 Documentation

- [`CLAUDE.md`](CLAUDE.md) - Technical development guide
- [`README_PRODUCTION.md`](README_PRODUCTION.md) - Detailed production guide
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) - Feature status and roadmap

## 🔒 Security Features

- Rate limiting protection
- Audit logging for admin actions
- Promo code validation with usage tracking
- Admin-only modal access
- Input validation for Egyptian formats
- CORS configuration
- SQL injection prevention (via PocketBase)

## 📦 Deployment Requirements

### Minimum Server Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04+ or similar
- **Ports**: 8090 (configurable)

### Recommended Production Setup
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Load Balancer**: nginx/Apache reverse proxy
- **SSL**: Let's Encrypt or commercial certificate
- **Monitoring**: Prometheus/Grafana or similar

---

**Built with ❤️ for the Egyptian agricultural community**

© 2024 Sheep Land Egypt. All rights reserved.