# Frontend - Sheep Land Egypt E-commerce

This directory contains the static frontend files for the Sheep Land Egypt e-commerce application.

## Structure

```
frontend/
├── index.html                 # Main application
├── dashboard.html            # Admin dashboard
├── app.js                    # Main application logic (Alpine.js)
├── styles.css               # Primary styles
├── styles-extra.css         # Additional styles
├── vendor/                  # Third-party libraries
│   ├── alpine.min.js        # Alpine.js framework
│   ├── pocketbase.umd.js    # PocketBase SDK
│   └── alpine-collapse.min.js
├── images/                  # Static images
├── archive_admin/           # Legacy admin interfaces
│   ├── management/          # Farm management system (Arabic)
│   └── feasibility/         # Feasibility calculator
└── robots.txt, sitemap.xml # SEO files
```

## Technology Stack

- **Framework**: Vanilla HTML/CSS/JavaScript with Alpine.js
- **API Client**: PocketBase JavaScript SDK
- **Styling**: Custom CSS with responsive design
- **Languages**: Arabic and English support
- **No Build Process**: Files served directly

## Development

The frontend is served by PocketBase from the backend. To develop:

1. Start the backend server:
   ```bash
   cd ../backend
   ./pocketbase serve --dev --publicDir=../frontend
   ```

2. Access the application at http://127.0.0.1:8090/

3. Edit files directly - no build step required

## Key Features

- **Multi-language**: Arabic (RTL) and English support
- **E-commerce**: Product catalog, cart, checkout
- **Payment Methods**: COD, bank transfer, crypto, e-wallets
- **Order Management**: Full order lifecycle
- **Admin Features**: Farm management, analytics
- **Mobile Responsive**: Works on all devices

## Architecture

- **Alpine.js Components**: Reactive UI components
- **PocketBase Integration**: Real-time data binding
- **Progressive Enhancement**: Works without JavaScript
- **Arabic-first Design**: RTL layout with Arabic typography