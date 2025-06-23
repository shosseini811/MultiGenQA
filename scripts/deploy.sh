#!/bin/bash

# MultiGenQA Production Deployment Script
# This script handles safe deployment to production with health checks and rollback

set -euo pipefail

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker."
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose is not installed."
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file $ENV_FILE not found."
        log_info "Please create it from the template: cp backend/env.production $ENV_FILE"
        exit 1
    fi
    
    # Check if SSL certificates exist (for production)
    if [[ ! -d "ssl" ]]; then
        log_warning "SSL certificates directory not found. Creating placeholder..."
        mkdir -p ssl
        log_info "Please add your SSL certificates to the ssl/ directory before production deployment."
    fi
    
    log_success "Prerequisites check passed"
}

# Create backup before deployment
create_backup() {
    log_info "Creating database backup before deployment..."
    
    # Check if database is running
    if docker-compose -f "$COMPOSE_FILE" ps database | grep -q "Up"; then
        docker-compose -f "$COMPOSE_FILE" --profile backup run --rm backup
        log_success "Backup created successfully"
    else
        log_warning "Database not running, skipping backup"
    fi
}

# Pull latest images
pull_images() {
    log_info "Pulling latest Docker images..."
    docker-compose -f "$COMPOSE_FILE" pull
    log_success "Images pulled successfully"
}

# Build services
build_services() {
    log_info "Building services..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    log_success "Services built successfully"
}

# Start services
start_services() {
    log_info "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    log_success "Services started"
}

# Health check function
check_health() {
    local service_url="$1"
    local service_name="$2"
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL))
    local attempt=1
    
    log_info "Checking health of $service_name..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$service_url" &> /dev/null; then
            log_success "$service_name is healthy"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts: $service_name not ready, waiting ${HEALTH_CHECK_INTERVAL}s..."
        sleep "$HEALTH_CHECK_INTERVAL"
        ((attempt++))
    done
    
    log_error "$service_name health check failed after $HEALTH_CHECK_TIMEOUT seconds"
    return 1
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Check backend health
    if ! check_health "http://localhost:5001/api/health" "Backend"; then
        return 1
    fi
    
    # Check frontend health
    if ! check_health "http://localhost:8080/health" "Frontend"; then
        return 1
    fi
    
    # Check database health
    if ! docker-compose -f "$COMPOSE_FILE" exec -T database pg_isready -U "${DB_USER:-multigenqa_user}" &> /dev/null; then
        log_error "Database health check failed"
        return 1
    fi
    log_success "Database is healthy"
    
    # Check Redis health
    if ! docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping &> /dev/null; then
        log_error "Redis health check failed"
        return 1
    fi
    log_success "Redis is healthy"
    
    log_success "All health checks passed"
    return 0
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    # Stop current services
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start previous version (if tagged)
    if docker images | grep -q "multigenqa.*previous"; then
        log_info "Starting previous version..."
        # This would require a more sophisticated tagging strategy
        log_warning "Rollback functionality requires implementing image tagging strategy"
    fi
    
    log_warning "Rollback completed. Please check the application status."
}

# Main deployment function
deploy() {
    log_info "🚀 Starting MultiGenQA production deployment..."
    log_info "📅 Deployment time: $(date)"
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Pull and build
    pull_images
    build_services
    
    # Start services
    start_services
    
    # Wait a bit for services to initialize
    log_info "Waiting for services to initialize..."
    sleep 30
    
    # Run health checks
    if run_health_checks; then
        log_success "🎉 Deployment completed successfully!"
        log_info "📊 Application status:"
        docker-compose -f "$COMPOSE_FILE" ps
        
        log_info "🔗 Application URLs:"
        log_info "   Frontend: https://localhost (or your domain)"
        log_info "   Backend API: https://localhost/api/health"
        log_info "   Monitoring: http://localhost:9090 (Prometheus)"
        log_info "   Dashboard: http://localhost:3001 (Grafana)"
        
    else
        log_error "Deployment failed health checks!"
        log_warning "Would you like to rollback? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            rollback
        fi
        exit 1
    fi
}

# Utility functions
show_logs() {
    log_info "Showing application logs..."
    docker-compose -f "$COMPOSE_FILE" logs -f --tail=100
}

show_status() {
    log_info "Application status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    log_info "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

stop_services() {
    log_info "Stopping services..."
    docker-compose -f "$COMPOSE_FILE" down
    log_success "Services stopped"
}

# Script usage
usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy the application (default)"
    echo "  status    Show application status"
    echo "  logs      Show application logs"
    echo "  stop      Stop all services"
    echo "  backup    Create database backup"
    echo "  rollback  Rollback to previous version"
    echo "  help      Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  COMPOSE_FILE              Docker compose file (default: docker-compose.prod.yml)"
    echo "  ENV_FILE                  Environment file (default: .env.production)"
    echo "  HEALTH_CHECK_TIMEOUT      Health check timeout in seconds (default: 300)"
    echo "  HEALTH_CHECK_INTERVAL     Health check interval in seconds (default: 10)"
}

# Main script logic
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    stop)
        stop_services
        ;;
    backup)
        create_backup
        ;;
    rollback)
        rollback
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac 