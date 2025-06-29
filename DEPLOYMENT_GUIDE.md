# Sheep Land Production Deployment Guide

## Pre-Deployment Checklist

### 1. Server Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Minimum 2 CPU cores, 4GB RAM
- 20GB+ SSD storage
- Open ports: 80, 443, 8090

### 2. Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git nginx certbot python3-certbot-nginx
```

## Deployment Steps

### Step 1: Clone Repository
```bash
cd /opt
sudo git clone https://github.com/304442/sheep.land.git
cd sheep.land
sudo chown -R $USER:$USER .
```

### Step 2: Configure PocketBase
```bash
cd backend
chmod +x ./pocketbase
chmod +x ./start-production.sh
```

### Step 3: Initial Setup
```bash
# Run migrations and create admin
./pocketbase migrate up
```

### Step 4: Configure Nginx Reverse Proxy
```bash
sudo nano /etc/nginx/sites-available/sheep.land
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/sheep.land /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

### Step 6: Create Systemd Service
```bash
sudo nano /etc/systemd/system/sheep-land.service
```

Add:
```ini
[Unit]
Description=Sheep Land E-commerce Platform
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/opt/sheep.land/backend
ExecStart=/opt/sheep.land/backend/pocketbase serve --publicDir="../frontend"
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable sheep-land
sudo systemctl start sheep-land
```

### Step 7: Configure Application

1. **Access Admin Panel**: https://your-domain.com/_/
2. **Login**: admin@sheep.land / admin@sheep2024
3. **Change Admin Password** immediately

#### Configure SMTP (Settings Collection)
- smtp_host: smtp.gmail.com (or your provider)
- smtp_port: 587
- smtp_username: your-email@gmail.com
- smtp_password: app-specific-password
- smtp_from_address: noreply@your-domain.com
- smtp_from_name: Sheep Land

#### Configure Payment Gateway
- Add API keys for your chosen provider
- Test in sandbox mode first

### Step 8: Production Configuration

#### Update Frontend API URL
```bash
cd /opt/sheep.land/frontend
nano app.js
```

Change:
```javascript
const pb = new PocketBase('/'); // Already configured for relative path
```

#### Environment Variables (Optional)
```bash
sudo nano /etc/environment
```

Add:
```bash
SHEEP_LAND_ENV="production"
SHEEP_LAND_PORT="8090"
```

### Step 9: Backup Configuration
```bash
# Create backup directory
sudo mkdir -p /opt/backups/sheep-land

# Create backup script
sudo nano /opt/backups/sheep-land-backup.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/sheep-land"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
cp /opt/sheep.land/backend/pb_data/data.db "$BACKUP_DIR/data_$DATE.db"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /opt/sheep.land/backend/pb_data/storage

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.db" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
```

Make executable and add to cron:
```bash
sudo chmod +x /opt/backups/sheep-land-backup.sh
sudo crontab -e
# Add: 0 2 * * * /opt/backups/sheep-land-backup.sh
```

### Step 10: Monitoring
```bash
# Check service status
sudo systemctl status sheep-land

# View logs
sudo journalctl -u sheep-land -f

# Monitor resources
htop
```

## Post-Deployment Tasks

### Security Hardening
1. **Firewall Configuration**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Fail2ban Setup**
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### Performance Optimization
1. **Enable Gzip in Nginx**
2. **Configure CDN for static assets**
3. **Set up Redis for caching (optional)**

### Monitoring Setup
1. **Install monitoring agent** (Datadog, New Relic, etc.)
2. **Set up uptime monitoring** (UptimeRobot, Pingdom)
3. **Configure log aggregation** (ELK stack, Papertrail)

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
sudo lsof -i :8090
sudo kill -9 <PID>
```

#### Permission Denied
```bash
sudo chown -R $USER:$USER /opt/sheep.land
chmod +x backend/pocketbase
```

#### Database Locked
```bash
cd backend
./pocketbase migrate down
./pocketbase migrate up
```

#### Service Won't Start
```bash
# Check logs
sudo journalctl -u sheep-land -n 100

# Run manually to see errors
cd /opt/sheep.land/backend
./pocketbase serve --publicDir="../frontend"
```

## Maintenance Commands

### Update Application
```bash
cd /opt/sheep.land
git pull origin main
sudo systemctl restart sheep-land
```

### Database Management
```bash
# Backup before maintenance
cp pb_data/data.db pb_data/data.db.backup

# Vacuum database
./pocketbase migrate vacuum
```

### Clear Logs
```bash
# PocketBase logs
rm -f pb_data/logs/*.log

# System logs
sudo journalctl --vacuum-time=7d
```

## Production Checklist

- [ ] Changed admin password
- [ ] Configured SMTP settings
- [ ] Set up payment gateway
- [ ] Configured SSL certificate
- [ ] Set up automated backups
- [ ] Configured monitoring
- [ ] Updated firewall rules
- [ ] Tested order flow
- [ ] Verified email delivery
- [ ] Set up CDN (optional)
- [ ] Configured WhatsApp API (optional)

## Support

For issues or questions:
- GitHub Issues: https://github.com/304442/sheep.land/issues
- Admin Panel: https://your-domain.com/_/
- Logs: `sudo journalctl -u sheep-land -f`

---

Last updated: December 2024