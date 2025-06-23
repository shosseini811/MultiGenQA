#!/bin/bash

# MultiGenQA Database Backup Script
# This script creates automated backups of the PostgreSQL database

set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-database}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-multigenqa}"
DB_USER="${DB_USER:-multigenqa_user}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="multigenqa_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

echo "🗄️  Starting database backup..."
echo "📅 Timestamp: $(date)"
echo "🎯 Target: $DB_HOST:$DB_PORT/$DB_NAME"
echo "📁 Backup file: $BACKUP_PATH"

# Create the backup
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose --clean --no-owner --no-privileges \
    --format=plain | gzip > "$BACKUP_PATH"; then
    
    echo "✅ Backup created successfully: $BACKUP_FILE"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    echo "📊 Backup size: $BACKUP_SIZE"
    
else
    echo "❌ Backup failed!"
    exit 1
fi

# Clean up old backups (keep only last N days)
echo "🧹 Cleaning up old backups (keeping last $RETENTION_DAYS days)..."

find "$BACKUP_DIR" -name "multigenqa_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List remaining backups
echo "📋 Current backups:"
ls -lh "$BACKUP_DIR"/multigenqa_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "🎉 Backup process completed successfully!"

# Optional: Upload to cloud storage (uncomment and configure as needed)
# echo "☁️  Uploading to cloud storage..."
# aws s3 cp "$BACKUP_PATH" s3://your-backup-bucket/multigenqa/
# echo "✅ Upload completed" 