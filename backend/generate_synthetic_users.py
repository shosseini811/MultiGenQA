#!/usr/bin/env python3
"""
Synthetic User Data Generator for MultiGenQA

This script generates 1000 synthetic users with realistic fake data and saves them to PostgreSQL.
It uses the Faker library to create realistic names, emails, and other user data.

Usage:
    python generate_synthetic_users.py

Requirements:
    pip install faker

Features:
- Generates 1000 unique users
- Creates realistic names, emails, and passwords
- Uses proper password hashing (same as production)
- Handles duplicate emails gracefully
- Provides progress updates
- Creates users with varied account statuses
"""

import os
import sys
from datetime import datetime, timedelta
from faker import Faker
import random
from dotenv import load_dotenv

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our models
from models import db, User
from app import app

# Load environment variables
load_dotenv()

# Initialize Faker with different locales for variety
fake = Faker(['en_US', 'en_GB', 'en_CA', 'en_AU'])

def generate_realistic_password():
    """
    Generate a realistic password that meets our security requirements.
    
    Returns:
        str: A secure password with mixed case, numbers, and special characters
    """
    # Common password patterns that users actually use (but secure)
    patterns = [
        lambda: fake.word().capitalize() + str(random.randint(10, 99)) + random.choice('!@#$%'),
        lambda: fake.first_name() + str(random.randint(1000, 9999)) + '!',
        lambda: fake.color_name().capitalize() + str(random.randint(100, 999)) + '@',
        lambda: fake.month_name() + str(random.randint(10, 99)) + '#',
        lambda: fake.word().capitalize() + fake.word().capitalize() + str(random.randint(10, 99)),
    ]
    
    return random.choice(patterns)()

def generate_user_data():
    """
    Generate realistic user data.
    
    Returns:
        dict: User data dictionary
    """
    first_name = fake.first_name()
    last_name = fake.last_name()
    
    # Generate email with some variety in domains
    domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 
               'protonmail.com', 'company.com', 'university.edu']
    
    # Create email variations
    email_patterns = [
        f"{first_name.lower()}.{last_name.lower()}@{random.choice(domains)}",
        f"{first_name.lower()}{last_name.lower()}@{random.choice(domains)}",
        f"{first_name.lower()}{random.randint(1, 999)}@{random.choice(domains)}",
        f"{first_name[0].lower()}{last_name.lower()}@{random.choice(domains)}",
        f"{first_name.lower()}_{last_name.lower()}@{random.choice(domains)}",
    ]
    
    email = random.choice(email_patterns)
    password = generate_realistic_password()
    
    # Generate realistic timestamps
    created_days_ago = random.randint(1, 365)  # Created within last year
    created_at = datetime.utcnow() - timedelta(days=created_days_ago)
    
    # Last active should be after creation and somewhat recent
    last_active_days_ago = random.randint(0, min(created_days_ago, 30))
    last_active = datetime.utcnow() - timedelta(days=last_active_days_ago)
    
    # Some users have logged in recently, others haven't
    last_login = None
    if random.random() > 0.3:  # 70% have logged in at least once
        login_days_ago = random.randint(0, min(created_days_ago, 60))
        last_login = datetime.utcnow() - timedelta(days=login_days_ago)
    
    # Account status variety
    is_active = random.random() > 0.05  # 95% active accounts
    is_verified = random.random() > 0.2  # 80% verified accounts
    
    return {
        'first_name': first_name,
        'last_name': last_name,
        'email': email,
        'password': password,
        'is_active': is_active,
        'is_verified': is_verified,
        'created_at': created_at,
        'last_active': last_active,
        'last_login': last_login
    }

def create_synthetic_users(count=1000):
    """
    Create synthetic users and save them to the database.
    
    Args:
        count (int): Number of users to create (default: 1000)
    """
    print(f"🚀 Starting synthetic user generation...")
    print(f"📊 Target: {count} users")
    print(f"🗄️  Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print("-" * 50)
    
    created_count = 0
    duplicate_count = 0
    error_count = 0
    
    with app.app_context():
        # Ensure tables exist
        db.create_all()
        
        for i in range(count):
            try:
                # Generate user data
                user_data = generate_user_data()
                
                # Check if email already exists
                existing_user = User.query.filter_by(email=user_data['email']).first()
                if existing_user:
                    duplicate_count += 1
                    continue
                
                # Create new user
                user = User(
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    email=user_data['email'],
                    is_active=user_data['is_active'],
                    is_verified=user_data['is_verified'],
                    created_at=user_data['created_at'],
                    last_active=user_data['last_active'],
                    last_login=user_data['last_login']
                )
                
                # Set password (this will hash it automatically)
                user.set_password(user_data['password'])
                
                # Add to database
                db.session.add(user)
                db.session.commit()
                
                created_count += 1
                
                # Progress update every 50 users
                if created_count % 50 == 0:
                    print(f"✅ Created {created_count} users...")
                
            except Exception as e:
                error_count += 1
                db.session.rollback()
                print(f"❌ Error creating user {i+1}: {str(e)}")
                continue
    
    # Final statistics
    print("-" * 50)
    print(f"🎉 Synthetic user generation completed!")
    print(f"✅ Successfully created: {created_count} users")
    print(f"⚠️  Duplicate emails skipped: {duplicate_count}")
    print(f"❌ Errors encountered: {error_count}")
    print(f"📈 Success rate: {(created_count / count) * 100:.1f}%")
    
    # Show some sample data
    print("\n📋 Sample generated users:")
    with app.app_context():
        sample_users = User.query.limit(5).all()
        for user in sample_users:
            print(f"   • {user.full_name} ({user.email}) - {'✓' if user.is_verified else '○'} {'Active' if user.is_active else 'Inactive'}")

def show_user_statistics():
    """Show statistics about users in the database."""
    print("\n📊 Database Statistics:")
    print("-" * 30)
    
    with app.app_context():
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        verified_users = User.query.filter_by(is_verified=True).count()
        recent_users = User.query.filter(
            User.created_at >= datetime.utcnow() - timedelta(days=30)
        ).count()
        
        print(f"Total Users: {total_users}")
        print(f"Active Users: {active_users} ({(active_users/total_users)*100:.1f}%)")
        print(f"Verified Users: {verified_users} ({(verified_users/total_users)*100:.1f}%)")
        print(f"Recent Users (30 days): {recent_users}")

def main():
    """Main function to run the synthetic user generation."""
    print("🔧 MultiGenQA Synthetic User Generator")
    print("=" * 50)
    
    # Check if we're in the right environment
    if not os.path.exists('.env'):
        print("⚠️  Warning: .env file not found. Using default database configuration.")
    
    try:
        # Generate users
        create_synthetic_users(1000)
        
        # Show statistics
        show_user_statistics()
        
        print(f"\n✨ All done! You can now test your application with 1000 synthetic users.")
        print(f"🔑 Sample password for testing: {generate_realistic_password()}")
        
    except Exception as e:
        print(f"💥 Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main() 