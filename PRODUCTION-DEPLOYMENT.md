# 🚀 Production Deployment Guide for MultiGenQA

This guide covers everything you need to deploy MultiGenQA to production with enterprise-grade security, monitoring, and reliability.

## 📋 Prerequisites

### System Requirements
- **Server**: Linux-based server (Ubuntu 20.04+ recommended)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: 50GB+ SSD
- **CPU**: 2+ cores
- **Network**: Public IP with domain name

### Software Requirements
- Docker Engine 20.10+
- Docker Compose 2.0+
- SSL certificates (Let's Encrypt or commercial)
- Domain name with DNS configured

## 🔐 Security Setup

### 1. SSL Certificates

#### Option A: Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem
```

#### Option B: Commercial SSL
```bash
# Create SSL directory
mkdir -p ssl

# Copy your certificates
cp your-certificate.crt ssl/cert.pem
cp your-private-key.key ssl/key.pem
```

### 2. Environment Configuration

```bash
# Copy production environment template
cp backend/env.production .env.production

# Edit with your production values
nano .env.production
```

**Required Environment Variables:**
```bash
# Database
DB_USER=multigenqa_prod_user
DB_PASSWORD=your-super-secure-password
DB_NAME=multigenqa_prod
SECRET_KEY=your-super-secret-flask-key

# Redis
REDIS_PASSWORD=your-redis-password

# AI API Keys
OPENAI_API_KEY=sk-your-production-openai-key
GOOGLE_API_KEY=your-production-google-key
ANTHROPIC_API_KEY=your-production-anthropic-key

# Security
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Monitoring
GRAFANA_PASSWORD=your-grafana-admin-password
```

### 3. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (redirects to HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 🐳 Production Deployment

### Quick Deployment
```bash
# Clone repository
git clone https://github.com/your-username/MultiGenQA.git
cd MultiGenQA

# Setup environment
cp backend/env.production .env.production
# Edit .env.production with your values

# Deploy
./scripts/deploy.sh
```

### Manual Deployment Steps

#### 1. Build and Start Services
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start all services
docker-compose -f docker-compose.prod.yml up -d
```

#### 2. Verify Deployment
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test health endpoints
curl https://your-domain.com/api/health
```

## 📊 Monitoring Setup

### Access Monitoring Dashboards

1. **Prometheus**: http://your-server-ip:9090
2. **Grafana**: http://your-server-ip:3001
   - Username: `admin`
   - Password: `your-grafana-password`

### Configure Alerts

#### Grafana Alert Rules
1. High error rate (>5% in 5 minutes)
2. High response time (>2s average)
3. Database connection failures
4. High memory usage (>80%)
5. High CPU usage (>80%)

### Log Aggregation

Logs are automatically collected and can be viewed:
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

## 🗄️ Database Management

### Automated Backups

Backups run automatically via the backup service:
```bash
# Manual backup
docker-compose -f docker-compose.prod.yml --profile backup run --rm backup

# View backups
ls -la backups/
```

### Database Maintenance

```bash
# Connect to database
docker-compose -f docker-compose.prod.yml exec database psql -U multigenqa_prod_user -d multigenqa_prod

# Database migrations (if needed)
docker-compose -f docker-compose.prod.yml exec backend flask db upgrade
```

## 🔄 Updates and Maintenance

### Application Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
./scripts/deploy.sh
```

### Security Updates

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### SSL Certificate Renewal

```bash
# Renew Let's Encrypt certificates
sudo certbot renew

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem

# Restart frontend to load new certificates
docker-compose -f docker-compose.prod.yml restart frontend
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Services Won't Start
```bash
# Check Docker daemon
sudo systemctl status docker

# Check disk space
df -h

# Check memory usage
free -h

# View service logs
docker-compose -f docker-compose.prod.yml logs [service-name]
```

#### 2. SSL Certificate Issues
```bash
# Verify certificate files
ls -la ssl/
openssl x509 -in ssl/cert.pem -text -noout

# Check nginx configuration
docker-compose -f docker-compose.prod.yml exec frontend nginx -t
```

#### 3. Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec database pg_isready

# Check database logs
docker-compose -f docker-compose.prod.yml logs database

# Test database connection
docker-compose -f docker-compose.prod.yml exec backend python -c "from models import db; print('DB OK' if db.engine.execute('SELECT 1') else 'DB Error')"
```

#### 4. High Memory Usage
```bash
# Check container resource usage
docker stats

# Restart services to free memory
docker-compose -f docker-compose.prod.yml restart
```

### Emergency Procedures

#### Rollback Deployment
```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Restore from backup (if needed)
# ... restore database from backup ...

# Start previous version
./scripts/deploy.sh rollback
```

#### Scale Services
```bash
# Scale backend for high load
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale with load balancer (requires additional configuration)
```

## 📈 Performance Optimization

### Database Optimization
- Regular VACUUM and ANALYZE
- Connection pooling
- Query optimization
- Read replicas for scaling

### Caching Strategy
- Redis for API responses
- CDN for static assets
- Browser caching headers

### Load Balancing
```yaml
# Add to docker-compose.prod.yml
nginx-lb:
  image: nginx:alpine
  volumes:
    - ./nginx-lb.conf:/etc/nginx/nginx.conf
  ports:
    - "80:80"
    - "443:443"
```

## 🔐 Security Hardening

### Additional Security Measures

1. **Rate Limiting**: Already configured in nginx
2. **WAF**: Consider Cloudflare or AWS WAF
3. **DDoS Protection**: Use Cloudflare or similar
4. **Security Headers**: Already configured
5. **Regular Updates**: Automated with Dependabot

### Security Monitoring

1. **Failed Login Attempts**: Monitor in logs
2. **Unusual API Usage**: Set up alerts
3. **Resource Usage**: Monitor for attacks
4. **SSL Certificate Expiry**: Set up alerts

## 📞 Support and Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check service health
- Review error logs
- Monitor resource usage

**Weekly:**
- Review security logs
- Check backup integrity
- Update dependencies

**Monthly:**
- Security patches
- Performance review
- Capacity planning

### Monitoring Checklist

- [ ] All services running
- [ ] SSL certificates valid
- [ ] Backups completing successfully
- [ ] Error rates within acceptable limits
- [ ] Response times acceptable
- [ ] Resource usage normal
- [ ] Security alerts reviewed

## 📚 Additional Resources

- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Nginx Security Guide](https://nginx.org/en/docs/http/securing_http.html)
- [Prometheus Monitoring](https://prometheus.io/docs/practices/naming/)

---

**Need Help?** Check the troubleshooting section or create an issue in the repository. 