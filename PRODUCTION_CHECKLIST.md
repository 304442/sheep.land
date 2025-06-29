# Sheep Land Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Copy `.env.example` to `.env` and configure all values
- [ ] Set `APP_ENV=production` and `APP_DEBUG=false`
- [ ] Configure proper domain in `APP_URL`
- [ ] Set strong admin credentials

### 2. Database Setup
- [ ] Run all migrations: `./pocketbase migrate up`
- [ ] Create admin user: `./pocketbase superuser create <email> <password>`
- [ ] Verify products are seeded correctly
- [ ] Test database backup process

### 3. Email Configuration
- [ ] Configure SMTP settings in admin panel
- [ ] Test email sending with order confirmation
- [ ] Verify email templates are loaded
- [ ] Set up alert email for error notifications

### 4. Security Configuration
- [ ] Enable HTTPS/SSL certificate
- [ ] Configure firewall rules (allow only 80, 443, SSH)
- [ ] Set up rate limiting values in settings
- [ ] Review and update CORS origins
- [ ] Update CSP hash values for inline scripts/styles
- [ ] Change default admin password

### 5. Payment Integration
- [ ] Configure payment gateway credentials
- [ ] Set up webhook endpoints
- [ ] Test payment flow in staging
- [ ] Enable production mode in payment provider

### 6. External Services
- [ ] Configure WhatsApp Business API (optional)
- [ ] Set up SMS provider (optional)
- [ ] Configure CDN for static assets (optional)
- [ ] Set up image optimization service

### 7. Performance Optimization
- [ ] Enable gzip compression
- [ ] Configure static asset caching headers
- [ ] Set up CDN for images
- [ ] Enable HTTP/2 support
- [ ] Configure database connection pooling

### 8. Monitoring Setup
- [ ] Configure error logging
- [ ] Set up uptime monitoring
- [ ] Configure performance monitoring
- [ ] Set up backup monitoring
- [ ] Configure alert thresholds

### 9. Backup Strategy
- [ ] Automated daily database backups
- [ ] Backup retention policy (30 days)
- [ ] Test backup restoration process
- [ ] Off-site backup storage

### 10. Final Testing
- [ ] Complete order flow test
- [ ] Test all payment methods
- [ ] Verify email notifications
- [ ] Test rate limiting
- [ ] Check mobile responsiveness
- [ ] Test Arabic/English switching
- [ ] Verify admin features access

## 🚀 Deployment Steps

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install dependencies
   sudo apt install -y git nginx certbot python3-certbot-nginx
   
   # Create app directory
   sudo mkdir -p /var/www/sheep.land
   sudo chown $USER:$USER /var/www/sheep.land
   ```

2. **Clone Repository**
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/sheep.land.git
   cd sheep.land
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name sheep.land www.sheep.land;
       
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

4. **SSL Certificate**
   ```bash
   sudo certbot --nginx -d sheep.land -d www.sheep.land
   ```

5. **SystemD Service**
   Create `/etc/systemd/system/sheep-land.service`:
   ```ini
   [Unit]
   Description=Sheep Land E-commerce Platform
   After=network.target
   
   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/sheep.land/backend
   ExecStart=/var/www/sheep.land/backend/pocketbase serve --publicDir="../frontend"
   Restart=on-failure
   RestartSec=10
   StandardOutput=append:/var/log/sheep-land/output.log
   StandardError=append:/var/log/sheep-land/error.log
   
   [Install]
   WantedBy=multi-user.target
   ```

6. **Start Service**
   ```bash
   # Create log directory
   sudo mkdir -p /var/log/sheep-land
   sudo chown www-data:www-data /var/log/sheep-land
   
   # Enable and start service
   sudo systemctl enable sheep-land
   sudo systemctl start sheep-land
   
   # Check status
   sudo systemctl status sheep-land
   ```

7. **Configure Firewall**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

## 📊 Post-Deployment Verification

1. **Health Check**
   ```bash
   curl https://sheep.land/api/health
   ```

2. **Test Order Flow**
   - Create test order
   - Verify inventory update
   - Check email delivery
   - Confirm payment processing

3. **Monitor Logs**
   ```bash
   sudo journalctl -u sheep-land -f
   tail -f /var/log/sheep-land/error.log
   ```

4. **Database Verification**
   ```bash
   cd /var/www/sheep.land/backend
   ./pocketbase admin
   # Check collections and data integrity
   ```

## 🔧 Maintenance Tasks

### Daily
- Check error logs
- Monitor disk space
- Verify backup completion

### Weekly
- Review performance metrics
- Check for security updates
- Analyze user feedback

### Monthly
- Update dependencies
- Review and optimize database
- Audit security logs
- Test backup restoration

## 🚨 Rollback Plan

1. **Quick Rollback**
   ```bash
   # Stop service
   sudo systemctl stop sheep-land
   
   # Restore previous version
   cd /var/www/sheep.land
   git checkout <previous-version-tag>
   
   # Restart service
   sudo systemctl start sheep-land
   ```

2. **Database Rollback**
   ```bash
   # Stop service
   sudo systemctl stop sheep-land
   
   # Restore database
   cd /var/www/sheep.land/backend
   ./pocketbase migrate down
   # Or restore from backup
   
   # Start service
   sudo systemctl start sheep-land
   ```

## 📞 Emergency Contacts

- **System Admin**: [Your contact]
- **Database Admin**: [Your contact]
- **Business Owner**: [Your contact]
- **Payment Provider Support**: [Contact info]
- **Hosting Provider**: [Contact info]

## 🎯 Success Metrics

Monitor these KPIs after deployment:
- Page load time < 3 seconds
- Error rate < 0.1%
- Uptime > 99.9%
- Order completion rate > 80%
- Email delivery rate > 95%

---

**Last Updated**: January 2025
**Version**: 1.0.0