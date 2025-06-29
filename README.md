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

### Development

1. **Start the backend:**
   ```bash
   cd backend
   ./start.sh
   ```

2. **Access the application:**
   - **App**: http://localhost:8090
   - **Admin**: http://localhost:8090/_/
   - **API**: http://localhost:8090/api/

### Production

Deploy using the included `pb-autodeploy.v3.sh` script which handles:
- Database migrations
- Service restart
- Logging

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

# Start development server
./start.sh

# Create new migration
./pocketbase migrate create migration_name

# Run migrations
./pocketbase migrate up
```

### Frontend Development
- Edit files directly in `frontend/`
- No build process required
- Changes reflect immediately
- Use browser dev tools for debugging

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