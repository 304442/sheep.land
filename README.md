# 🐑 Sheep Land Egypt

A full-stack e-commerce platform for sheep farming business in Egypt, specializing in live sheep sales, Udheya services, fresh meat products, and event catering.

## 🏗️ Architecture

```
sheep.land/
├── backend/          # PocketBase API server
├── frontend/         # Static web application  
└── docs/            # Documentation
```

### Backend
- **PocketBase** - Self-hosted Backend-as-a-Service
- **SQLite** - Database with automated migrations
- **JavaScript Hooks** - Server-side business logic
- **REST API** - Full CRUD operations

### Frontend  
- **Alpine.js** - Reactive UI framework
- **Vanilla JS** - No build process required
- **Arabic/English** - Bilingual support with RTL
- **Responsive** - Mobile-first design

## 🚀 Quick Start

### 🛠️ Development

1. **Start development server:**
   ```bash
   cd backend
   ./start.sh
   ```

2. **Access the application:**
   - **App**: http://localhost:8090
   - **Admin Dashboard**: http://localhost:8090/_/
   - **API**: http://localhost:8090/api/

### 🚀 Production Deployment

**Ready for immediate production deployment!**

1. **Quick Production Start:**
   ```bash
   cd backend
   ./start-production.sh
   ```

2. **Manual Production Setup:**
   ```bash
   cd backend
   ./pocketbase migrate up                    # Apply migrations
   ./pocketbase serve --publicDir=../frontend # Start production server
   ```

3. **Automated Deployment:**
   ```bash
   # Using deployment script (not in repo)
   ./pb-autodeploy.v3.sh
   ```

**Features:**
- ✅ Zero-setup database initialization
- ✅ Automated migrations
- ✅ Production-optimized configuration
- ✅ Static file serving

## ✨ Features

### 🛒 E-commerce
- Product catalog with categories
- Shopping cart and checkout
- Multiple payment methods (COD, bank transfer, crypto)
- Order tracking and management
- Email notifications

### 🐑 Livestock Management
- Live sheep inventory
- Udheya (Islamic sacrifice) services
- Weight and health tracking
- Breeding records

### 📊 Business Tools
- Sales analytics
- Farm management dashboard
- Feasibility calculator
- Customer relationship management

### 🌐 Multi-language
- Arabic (primary) with RTL support
- English interface
- Cultural and religious considerations

## 🛠️ Development

### Backend Development
```bash
cd backend

# Development server (hot reload, detailed logging)
./start.sh

# Production server (optimized)
./start-production.sh

# Database management
./pocketbase migrate create migration_name  # Create new migration
./pocketbase migrate up                     # Apply migrations
./pocketbase superuser upsert email pass   # Create admin user
```

### Frontend Development
- **No build process** - Edit files directly in `frontend/`
- **Hot reload** - Changes reflect immediately
- **Alpine.js** - Reactive components for dynamic UI
- **Production-ready** - Files served as-is

## 📚 Documentation

- [`backend/README.md`](backend/README.md) - Backend setup and API
- [`frontend/README.md`](frontend/README.md) - Frontend architecture
- [`CLAUDE.md`](CLAUDE.md) - Developer guidance
- [`QA_TEST_REPORT.md`](QA_TEST_REPORT.md) - Test results

## 🎯 Tech Stack

- **Backend**: PocketBase, SQLite, JavaScript
- **Frontend**: HTML, CSS, Alpine.js, PocketBase SDK
- **Deployment**: Shell scripts, systemd
- **Testing**: Playwright (configured)

## 📦 What's Included

### Core Business Logic
- Order processing with validation
- Inventory management
- Payment processing integration
- Email notifications
- User authentication

### Admin Interfaces  
- Farm management system
- Analytics dashboard
- Order management
- Customer support tools

### Customer Experience
- Product browsing and search
- Cart and checkout flow
- Account management  
- Order history and tracking

## 🔒 Security

- Input validation and sanitization
- CORS configuration
- Authentication and authorization
- SQL injection prevention
- XSS protection

## 🌍 Localization

- Arabic-first design
- RTL text support
- Cultural preferences
- Religious considerations (Halal, Islamic calendar)
- Egyptian market specifics

---

**Built with ❤️ for the Egyptian agricultural community**