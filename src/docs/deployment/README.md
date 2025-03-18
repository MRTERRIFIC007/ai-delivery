# OptiDeliver Deployment Guide

## Overview

This document provides detailed instructions for deploying the OptiDeliver system, including both frontend and backend components. The deployment process is designed to be scalable, secure, and maintainable.

## System Requirements

### Hardware Requirements

- **Production Server**:

  - CPU: 4+ cores
  - RAM: 8GB minimum
  - Storage: 100GB SSD
  - Network: 100Mbps minimum

- **Development Server**:
  - CPU: 2+ cores
  - RAM: 4GB minimum
  - Storage: 50GB SSD
  - Network: 50Mbps minimum

### Software Requirements

- Node.js v16 or higher
- MongoDB v5.0 or higher
- Redis v6.0 or higher (for caching)
- Nginx v1.20 or higher
- Docker v20.10 or higher
- Docker Compose v2.0 or higher

## Deployment Architecture

```
[Client] → [Nginx Load Balancer]
                ↓
[Frontend Container] → [Backend Container]
                          ↓
                    [MongoDB Container]
                          ↓
                    [Redis Container]
                          ↓
                    [AI Service Container]
```

## Environment Setup

### 1. Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required software
sudo apt install -y nginx docker.io docker-compose

# Start and enable services
sudo systemctl start docker
sudo systemctl enable docker
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Network Configuration

```bash
# Configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5003/tcp
sudo ufw allow 27017/tcp
sudo ufw allow 6379/tcp
sudo ufw enable
```

### 3. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d optideliver.com -d www.optideliver.com
```

## Docker Deployment

### 1. Docker Compose Configuration

```yaml
version: "3.8"

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
      - API_URL=https://api.optideliver.com
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "5003:5003"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/optideliver
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=your-secure-password

  redis:
    image: redis:6.0
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  ai-service:
    build: ./ai-service
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - MODEL_PATH=/app/models
    volumes:
      - ai_models:/app/models

volumes:
  mongodb_data:
  redis_data:
  ai_models:
```

### 2. Build and Deploy

```bash
# Clone repository
git clone https://github.com/your-org/optideliver.git
cd optideliver

# Build and start containers
docker-compose build
docker-compose up -d

# Check container status
docker-compose ps
```

## Nginx Configuration

### 1. Frontend Configuration

```nginx
server {
    listen 80;
    server_name optideliver.com www.optideliver.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Backend Configuration

```nginx
server {
    listen 443 ssl;
    server_name api.optideliver.com;

    ssl_certificate /etc/letsencrypt/live/optideliver.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/optideliver.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Setup

### 1. MongoDB Configuration

```bash
# Connect to MongoDB container
docker exec -it optideliver_mongodb_1 mongosh

# Create database and user
use optideliver
db.createUser({
  user: "optideliver_user",
  pwd: "your-secure-password",
  roles: [
    { role: "readWrite", db: "optideliver" }
  ]
})

# Create indexes
db.orders.createIndex({ "createdAt": 1 })
db.orders.createIndex({ "status": 1 })
db.users.createIndex({ "email": 1 }, { unique: true })
```

### 2. Redis Configuration

```bash
# Connect to Redis container
docker exec -it optideliver_redis_1 redis-cli

# Set configuration
CONFIG SET maxmemory 2gb
CONFIG SET maxmemory-policy allkeys-lru
```

## Monitoring Setup

### 1. Application Monitoring

```bash
# Install Prometheus
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Install Grafana
docker run -d \
  --name grafana \
  -p 3000:3000 \
  -v grafana_data:/var/lib/grafana \
  grafana/grafana
```

### 2. Log Management

```bash
# Install ELK Stack
docker-compose -f elk.yml up -d
```

## Backup Strategy

### 1. Database Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
docker exec optideliver_mongodb_1 mongodump --out /backup

# Compress backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz /backup

# Clean old backups
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

# Make script executable
chmod +x backup.sh

# Add to crontab
0 2 * * * /path/to/backup.sh
```

### 2. Configuration Backup

```bash
# Backup configuration files
tar -czf config_backup.tar.gz \
  /etc/nginx/sites-enabled \
  /etc/letsencrypt \
  docker-compose.yml
```

## Security Measures

### 1. SSL/TLS Configuration

```nginx
# Add to Nginx configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### 2. Security Headers

```nginx
# Add to Nginx configuration
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
add_header X-Content-Type-Options "nosniff";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

## Scaling Strategy

### 1. Horizontal Scaling

```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Update Nginx configuration for load balancing
upstream backend {
    server backend:5003;
    server backend:5004;
    server backend:5005;
}
```

### 2. Database Scaling

```bash
# Configure MongoDB replica set
docker-compose -f mongodb-replica.yml up -d
```

## Maintenance Procedures

### 1. Regular Updates

```bash
# Update containers
docker-compose pull
docker-compose up -d

# Update system packages
sudo apt update && sudo apt upgrade -y
```

### 2. Log Rotation

```bash
# Configure log rotation
cat > /etc/logrotate.d/optideliver << 'EOF'
/var/log/optideliver/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
}
EOF
```

## Troubleshooting

### 1. Common Issues

- **Container won't start**: Check logs with `docker-compose logs`
- **Database connection issues**: Verify MongoDB credentials and network
- **SSL certificate problems**: Check Certbot logs and certificate expiration
- **Performance issues**: Monitor resource usage with `docker stats`

### 2. Log Access

```bash
# View application logs
docker-compose logs -f

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View MongoDB logs
docker-compose logs mongodb
```

## Rollback Procedures

### 1. Application Rollback

```bash
# Revert to previous version
git checkout <previous-commit>
docker-compose down
docker-compose build
docker-compose up -d
```

### 2. Database Rollback

```bash
# Restore from backup
tar -xzf backup_20240101_000000.tar.gz
docker exec -i optideliver_mongodb_1 mongorestore /backup
```

## Support and Maintenance

### 1. Monitoring Tools

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- ELK Stack: http://localhost:5601

### 2. Contact Information

- Technical Support: support@optideliver.com
- Emergency Contact: emergency@optideliver.com
- Status Page: https://status.optideliver.com

## Deployment Checklist

- [ ] Server requirements met
- [ ] SSL certificates installed
- [ ] Docker and dependencies installed
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] Nginx configured
- [ ] Monitoring tools set up
- [ ] Backup strategy implemented
- [ ] Security measures in place
- [ ] Load testing completed
- [ ] Documentation updated
