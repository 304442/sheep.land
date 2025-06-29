# 🚀 Production Deployment Guide

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Domain name pointed to server
- SSL certificate (Let's Encrypt recommended)
- Systemd for service management

## Quick Production Deployment

### 1. **Clone Repository**
```bash
git clone https://github.com/YOUR_ORG/sheep.land.git
cd sheep.land
```

### 2. **Download PocketBase**
```bash
cd backend
wget https://github.com/pocketbase/pocketbase/releases/download/v0.28.4/pocketbase_0.28.4_linux_amd64.zip
unzip pocketbase_0.28.4_linux_amd64.zip
chmod +x pocketbase
rm pocketbase_0.28.4_linux_amd64.zip
```

### 3. **Start Production Server**
```bash
./start-production.sh
```

## Advanced Production Setup

### Systemd Service Configuration

1. **Create service file:**
```bash
sudo nano /etc/systemd/system/sheepland.service
```

```ini
[Unit]
Description=Sheep Land E-commerce Platform
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/sheep.land/backend
ExecStart=/home/ubuntu/sheep.land/backend/pocketbase serve --publicDir=../frontend
Restart=always
RestartSec=5
Environment=PATH=/usr/bin:/usr/local/bin

[Install]
WantedBy=multi-user.target
```

2. **Enable and start service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable sheepland
sudo systemctl start sheepland
sudo systemctl status sheepland
```

### Nginx Reverse Proxy

1. **Install Nginx:**
```bash
sudo apt update
sudo apt install nginx
```

2. **Configure site:**
```bash
sudo nano /etc/nginx/sites-available/sheepland
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/sheepland /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Database Management

### Backup Strategy
```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/sheepland"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp backend/pb_data/data.db $BACKUP_DIR/data_$DATE.db
gzip $BACKUP_DIR/data_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "data_*.db.gz" -mtime +30 -delete
```

### Migration Management
```bash
# Apply migrations
cd backend
./pocketbase migrate up

# Create new migration
./pocketbase migrate create add_new_feature
```

## Monitoring & Logs

### Log Management
```bash
# View service logs
sudo journalctl -u sheepland -f

# View PocketBase logs
tail -f backend/pb_data/logs/data.db
```

### Health Checks
```bash
# API health check
curl http://localhost:8090/api/health

# Service status
sudo systemctl status sheepland
```

## Performance Optimization

### Database Optimization
- Regular VACUUM operations
- Index optimization for frequently queried fields
- Monitoring query performance

### Static File Serving
- Nginx for static file serving (optional)
- Image optimization and compression
- CDN for global content delivery

## Security Configuration

### Firewall Setup
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### PocketBase Security
- Regular updates to latest version
- Strong admin passwords
- API rate limiting
- CORS configuration

## Troubleshooting

### Common Issues

1. **Service won't start:**
   ```bash
   sudo journalctl -u sheepland --no-pager
   ```

2. **Database migration errors:**
   ```bash
   cd backend
   ./pocketbase migrate down 1  # Rollback last migration
   ```

3. **Permission issues:**
   ```bash
   sudo chown -R ubuntu:ubuntu /home/ubuntu/sheep.land
   chmod +x backend/pocketbase
   ```

### Performance Issues
- Check disk space: `df -h`
- Monitor memory: `free -h`
- Check CPU usage: `top`

## Environment-Specific Configuration

### Production Environment Variables
Create `.env` file in backend directory:
```
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-app-password
```

### Development vs Production
- Development: `./start.sh` (includes hot reload, debug logging)
- Production: `./start-production.sh` (optimized, no debug output)

---

## 🎯 Deployment Checklist

- [ ] Server provisioned and secured
- [ ] Domain name configured
- [ ] SSL certificate installed
- [ ] PocketBase downloaded and configured
- [ ] Systemd service created and enabled
- [ ] Nginx reverse proxy configured
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Health checks verified

**The platform is production-ready and battle-tested!** 🚀