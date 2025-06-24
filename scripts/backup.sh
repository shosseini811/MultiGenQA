#!/bin/bash

# MultiGenQA Database Backup Script
# This script creates automated backups of the PostgreSQL database

set -euo pipefail

# Configuration - Uses environment variables with fallback defaults
DB_HOST="${DB_HOST:-database}"          # Database host (default: 'database' for Docker)
DB_PORT="${DB_PORT:-5432}"              # PostgreSQL port (default: 5432)
DB_NAME="${DB_NAME:-multigenqa}"        # Database name to backup
DB_USER="${DB_USER:-multigenqa_user}"   # Database username for connection
BACKUP_DIR="${BACKUP_DIR:-/backups}"    # Directory to store backup files
RETENTION_DAYS="${RETENTION_DAYS:-7}"   # Number of days to keep old backups

# Create backup directory if it doesn't exist (-p creates parent dirs if needed)
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp (YYYYMMDD_HHMMSS format)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="multigenqa_backup_${TIMESTAMP}.sql.gz"  # Compressed SQL file
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"               # Full path to backup file

echo "🗄️  Starting database backup..."
echo "📅 Timestamp: $(date)"
echo "🎯 Target: $DB_HOST:$DB_PORT/$DB_NAME"
echo "📁 Backup file: $BACKUP_PATH"

# Create the backup using pg_dump
# pg_dump options explained:
# -h: database host, -p: port, -U: username, -d: database name
# --verbose: show detailed progress, --clean: include DROP commands
# --no-owner: don't include ownership info, --no-privileges: don't include permissions
# --format=plain: output as plain SQL, | gzip: compress output
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose --clean --no-owner --no-privileges \
    --format=plain | gzip > "$BACKUP_PATH"; then
    
    echo "✅ Backup created successfully: $BACKUP_FILE"
    
    # Get backup file size in human-readable format
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)  # du -h shows size in KB/MB/GB, cut extracts first field
    echo "📊 Backup size: $BACKUP_SIZE"
    
else
    echo "❌ Backup failed!"
    exit 1
fi

# Clean up old backups (keep only last N days)
echo "🧹 Cleaning up old backups (keeping last $RETENTION_DAYS days)..."

# Find and delete backup files older than RETENTION_DAYS
# -name: match files with this pattern, -type f: files only, -mtime +N: older than N days
find "$BACKUP_DIR" -name "multigenqa_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List remaining backups with sizes and dates
echo "📋 Current backups:"
ls -lh "$BACKUP_DIR"/multigenqa_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "🎉 Backup process completed successfully!"

# Optional: Upload to cloud storage (uncomment and configure as needed)
# echo "☁️  Uploading to cloud storage..."
# aws s3 cp "$BACKUP_PATH" s3://your-backup-bucket/multigenqa/
# echo "✅ Upload completed" 