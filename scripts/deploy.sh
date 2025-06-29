#!/bin/bash
# Deployment script for Sheep Land PocketBase

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Functions
log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Check requirements
check_requirements() {
    log "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    log "✓ All requirements met"
}

# Create .env file if it doesn't exist
setup_env() {
    if [ ! -f "$ENV_FILE" ]; then
        log "Creating .env file..."
        cat > "$ENV_FILE" << EOF
# Admin credentials (change these!)
ADMIN_EMAIL=admin@sheep.land
ADMIN_PASSWORD=changeme123

# Domain configuration
DOMAIN=sheep.land

# SSL configuration (for production)
SSL_EMAIL=admin@sheep.land

# Backup configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=7
EOF
        warn "Created .env file - PLEASE UPDATE THE DEFAULT CREDENTIALS!"
    else
        log "Using existing .env file"
    fi
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Pull latest changes
    if [ -d ".git" ]; then
        log "Pulling latest changes from git..."
        git pull || warn "Could not pull latest changes"
    fi
    
    # Build images
    log "Building Docker images..."
    docker-compose build --no-cache
    
    # Stop existing containers
    if docker-compose ps | grep -q "Up"; then
        log "Stopping existing containers..."
        docker-compose down
    fi
    
    # Start services
    log "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 5
    
    # Check health
    if docker-compose ps | grep -q "healthy"; then
        log "✓ Services are healthy"
    else
        warn "Services may not be fully healthy yet"
    fi
    
    # Show logs
    log "Recent logs:"
    docker-compose logs --tail=20
}

# Backup function
backup() {
    log "Creating backup..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    docker-compose exec -T pocketbase sh -c 'cd /pb && tar -czf - pb_data' > "$BACKUP_DIR/pb_data.tar.gz"
    
    log "✓ Backup created at $BACKUP_DIR"
}

# Main menu
main() {
    echo "Sheep Land Deployment Script"
    echo "=========================="
    echo ""
    echo "1) Deploy (build and start)"
    echo "2) Stop services"
    echo "3) View logs"
    echo "4) Create backup"
    echo "5) Run migrations only"
    echo "6) Shell into PocketBase container"
    echo "7) Update and restart"
    echo "8) View status"
    echo "0) Exit"
    echo ""
    read -p "Select option: " choice
    
    case $choice in
        1)
            check_requirements
            setup_env
            deploy
            ;;
        2)
            log "Stopping services..."
            docker-compose down
            ;;
        3)
            docker-compose logs -f
            ;;
        4)
            backup
            ;;
        5)
            log "Running migrations..."
            docker-compose exec pocketbase /usr/local/bin/pocketbase migrate up --dir=/pb/pb_data --migrationsDir=/pb/pb_migrations
            ;;
        6)
            docker-compose exec pocketbase sh
            ;;
        7)
            log "Updating and restarting..."
            git pull
            docker-compose build
            docker-compose up -d
            ;;
        8)
            docker-compose ps
            ;;
        0)
            exit 0
            ;;
        *)
            error "Invalid option"
            ;;
    esac
}

# Run main if no arguments, otherwise run specific command
if [ $# -eq 0 ]; then
    main
else
    case $1 in
        deploy)
            check_requirements
            setup_env
            deploy
            ;;
        backup)
            backup
            ;;
        *)
            error "Unknown command: $1"
            exit 1
            ;;
    esac
fi