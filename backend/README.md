# Backend - PocketBase API Server

This directory contains the PocketBase backend server and related files.

## Structure

```
backend/
├── pocketbase              # PocketBase executable
├── pb_data/               # Database and runtime data
├── pb_hooks/              # JavaScript server-side hooks
├── pb_migrations/         # Database migration files
└── pocketbase.log        # Server logs
```

## Quick Start

```bash
cd backend
./pocketbase serve --dev
```

The server will start at:
- **API**: http://127.0.0.1:8090/api/
- **Admin Dashboard**: http://127.0.0.1:8090/_/
- **Frontend**: http://127.0.0.1:8090/ (serves from `../frontend/`)

## Configuration

PocketBase serves static files from the `../frontend/` directory using the `--publicDir` flag.

## Development

- **Hooks**: Edit files in `pb_hooks/` (auto-reload enabled)
- **Migrations**: Create new migrations with `./pocketbase migrate create <name>`
- **Database**: SQLite database stored in `pb_data/data.db`

## Production

For production deployment, use the `pb-autodeploy.v3.sh` script which:
- Runs database migrations automatically
- Restarts the PocketBase service
- Logs migration status