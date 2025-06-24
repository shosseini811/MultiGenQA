#!/bin/bash
# Shebang line - tells the system to use bash to execute this script

# MultiGenQA Production Deployment Script
# This script handles safe deployment to production with health checks and rollback

# Set strict error handling:
# -e: Exit immediately if any command fails
# -u: Exit if trying to use undefined variables
# -o pipefail: Exit if any command in a pipeline fails
set -euo pipefail

# Configuration variables with default values
# Use environment variable if set, otherwise use default value after :-
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"  # Docker compose file to use
ENV_FILE="${ENV_FILE:-.env.production}"                  # Environment variables file
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"      # Max time to wait for health checks (5 minutes)
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"     # Time between health check attempts (10 seconds)

# ANSI color codes for colored terminal output
RED='\033[0;31m'     # Red text for errors
GREEN='\033[0;32m'   # Green text for success messages
YELLOW='\033[1;33m'  # Yellow text for warnings
BLUE='\033[0;34m'    # Blue text for info messages
NC='\033[0m'         # No Color - resets text color to default

# Logging functions for consistent, colored output
log_info() {
    # echo -e enables interpretation of backslash escapes for colors
    # $1 is the first argument passed to the function
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    # Print success messages in green with checkmark emoji
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    # Print warning messages in yellow with warning emoji
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    # Print error messages in red with X emoji
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker daemon is running by calling docker info
    # &> /dev/null redirects both stdout and stderr to /dev/null (suppresses output)
    # ! negates the exit code - if docker info fails, the condition is true
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker."
        exit 1  # Exit with error code 1
    fi
    
    # Check if docker-compose command is available in PATH
    # command -v returns the path to the command if found, fails if not found
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose is not installed."
        exit 1
    fi
    
    # Check if the environment file exists using file test operator -f
    # [[ ]] is bash's enhanced test command, ! negates the condition
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file $ENV_FILE not found."
        log_info "Please create it from the template: cp backend/env.production $ENV_FILE"
        exit 1
    fi
    
    # Check if SSL certificates directory exists using directory test operator -d
    if [[ ! -d "ssl" ]]; then
        log_warning "SSL certificates directory not found. Creating placeholder..."
        # mkdir -p creates directory and any missing parent directories
        mkdir -p ssl
        log_info "Please add your SSL certificates to the ssl/ directory before production deployment."
    fi
    
    log_success "Prerequisites check passed"
}

# Create backup before deployment
create_backup() {
    log_info "Creating database backup before deployment..."
    
    # Check if database container is running
    # docker-compose ps lists running containers, grep -q searches quietly (no output)
    # grep -q "Up" returns 0 if "Up" is found in the output, 1 if not found
    if docker-compose -f "$COMPOSE_FILE" ps database | grep -q "Up"; then
        # Run backup service with specific profile, --rm removes container after completion
        # --profile backup activates the backup profile defined in docker-compose
        docker-compose -f "$COMPOSE_FILE" --profile backup run --rm backup
        log_success "Backup created successfully"
    else
        log_warning "Database not running, skipping backup"
    fi
}

# Pull latest Docker images from registry
pull_images() {
    log_info "Pulling latest Docker images..."
    # docker-compose pull downloads the latest versions of all images defined in compose file
    # This ensures we have the most recent base images and dependencies
    docker-compose -f "$COMPOSE_FILE" pull
    log_success "Images pulled successfully"
}

# Build all services defined in docker-compose file
build_services() {
    log_info "Building services..."
    # docker-compose build compiles/builds all services that have a 'build' section
    # --no-cache forces a complete rebuild without using cached layers
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    log_success "Services built successfully"
}

# Start all services in detached mode
start_services() {
    log_info "Starting services..."
    # docker-compose up starts all services defined in the compose file
    # -d (detached) runs containers in background and prints container IDs
    docker-compose -f "$COMPOSE_FILE" up -d
    log_success "Services started"
}

# Health check function for individual services
check_health() {
    # local variables are only accessible within this function
    local service_url="$1"    # First parameter: URL to check
    local service_name="$2"   # Second parameter: Human-readable service name
    # Calculate maximum attempts by dividing timeout by interval
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL))
    local attempt=1           # Counter for current attempt
    
    log_info "Checking health of $service_name..."
    
    # Loop while attempt is less than or equal to max attempts
    while [[ $attempt -le $max_attempts ]]; do
        # curl -f fails silently on HTTP errors, -s suppresses progress output
        # &> /dev/null redirects all output to null (silent)
        if curl -f -s "$service_url" &> /dev/null; then
            log_success "$service_name is healthy"
            return 0  # Return success (0) if health check passes
        fi
        
        log_info "Attempt $attempt/$max_attempts: $service_name not ready, waiting ${HEALTH_CHECK_INTERVAL}s..."
        # sleep pauses execution for specified number of seconds
        sleep "$HEALTH_CHECK_INTERVAL"
        # ((attempt++)) increments the attempt counter using arithmetic expansion
        ((attempt++))
    done
    
    log_error "$service_name health check failed after $HEALTH_CHECK_TIMEOUT seconds"
    return 1  # Return failure (1) if all attempts exhausted
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Check backend API health by calling its health endpoint
    if ! check_health "http://localhost:5001/api/health" "Backend"; then
        return 1  # Exit function with failure if backend health check fails
    fi
    
    # Check frontend health by calling its health endpoint
    if ! check_health "http://localhost:8080/health" "Frontend"; then
        return 1  # Exit function with failure if frontend health check fails
    fi
    
    # Check PostgreSQL database health using pg_isready command
    # docker-compose exec runs a command inside a running container
    # -T disables pseudo-TTY allocation (needed for scripts)
    # pg_isready checks if PostgreSQL server is ready to accept connections
    # -U specifies the database user (uses env var or default)
    if ! docker-compose -f "$COMPOSE_FILE" exec -T database pg_isready -U "${DB_USER:-multigenqa_user}" &> /dev/null; then
        log_error "Database health check failed"
        return 1
    fi
    log_success "Database is healthy"
    
    # Check Redis health using redis-cli ping command
    # redis-cli ping returns PONG if Redis server is responding
    if ! docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping &> /dev/null; then
        log_error "Redis health check failed"
        return 1
    fi
    log_success "Redis is healthy"
    
    log_success "All health checks passed"
    return 0
}

# Rollback function to revert to previous deployment
rollback() {
    log_warning "Rolling back deployment..."
    
    # Stop all current services and remove containers
    # docker-compose down stops and removes containers, networks, volumes, and images
    docker-compose -f "$COMPOSE_FILE" down
    
    # Check if previous version images exist with "previous" tag
    # docker images lists all images, grep -q searches quietly for pattern
    if docker images | grep -q "multigenqa.*previous"; then
        log_info "Starting previous version..."
        # This would require a more sophisticated tagging strategy
        # In a full implementation, you would retag images and restart services
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
    
    # Wait for services to initialize before running health checks
    # sleep 30 pauses script execution for 30 seconds to allow containers to start up
    log_info "Waiting for services to initialize..."
    sleep 30
    
    # Run health checks
    if run_health_checks; then
        log_success "🎉 Deployment completed successfully!"
        log_info "📊 Application status:"
        # docker-compose ps shows status of all services defined in compose file
        docker-compose -f "$COMPOSE_FILE" ps
        
        log_info "🔗 Application URLs:"
        log_info "   Frontend: https://localhost (or your domain)"
        log_info "   Backend API: https://localhost/api/health"
        log_info "   Monitoring: http://localhost:9090 (Prometheus)"
        log_info "   Dashboard: http://localhost:3001 (Grafana)"
        
    else
        log_error "Deployment failed health checks!"
        log_warning "Would you like to rollback? (y/N)"
        # read -r prevents backslash escapes from being interpreted
        # response variable stores user input
        read -r response
        # [[ "$response" =~ ^[Yy]$ ]] uses regex to match Y or y at start and end of string
        if [[ "$response" =~ ^[Yy]$ ]]; then
            rollback
        fi
        exit 1  # Exit with error code if health checks failed
    fi
}

# Utility functions for management and monitoring
show_logs() {
    log_info "Showing application logs..."
    # docker-compose logs shows logs from all services
    # -f follows log output (like tail -f)
    # --tail=100 shows last 100 lines from each service
    docker-compose -f "$COMPOSE_FILE" logs -f --tail=100
}

show_status() {
    log_info "Application status:"
    # docker-compose ps shows status of all services (running, stopped, etc.)
    docker-compose -f "$COMPOSE_FILE" ps
    
    log_info "Resource usage:"
    # docker stats shows real-time resource usage statistics
    # --no-stream shows stats once instead of continuously
    # --format specifies custom output format with container name, CPU%, and memory usage
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

stop_services() {
    log_info "Stopping services..."
    # docker-compose down stops and removes containers, networks, and volumes
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

# Main script logic - processes command line arguments
# ${1:-deploy} uses first argument if provided, otherwise defaults to "deploy"
case "${1:-deploy}" in
    deploy)
        # Run full deployment process
        deploy
        ;;
    status)
        # Show current application status and resource usage
        show_status
        ;;
    logs)
        # Follow application logs in real-time
        show_logs
        ;;
    stop)
        # Stop all running services
        stop_services
        ;;
    backup)
        # Create database backup only
        create_backup
        ;;
    rollback)
        # Rollback to previous deployment
        rollback
        ;;
    help|--help|-h)
        # Show usage information
        usage
        ;;
    *)
        # Handle unknown commands
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac 