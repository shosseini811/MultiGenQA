#!/usr/bin/env python3
"""
Helper script to start the MultiGenQA backend server.
This script checks for the required environment variables and starts the Flask server.
"""

import os
import sys
from pathlib import Path

def check_environment():
    """Check if the required environment variables are set."""
    backend_dir = Path(__file__).parent / 'backend'
    env_file = backend_dir / '.env'
    env_example = backend_dir / 'env.example'
    
    if not env_file.exists():
        print("❌ Error: .env file not found in backend directory")
        print(f"📝 Please copy {env_example} to {env_file}")
        print("   and add your API keys.")
        print("\nExample:")
        print(f"   cp {env_example} {env_file}")
        return False
    
    # Check if .env file has content
    with open(env_file, 'r') as f:
        content = f.read().strip()
        if not content or 'your_' in content:
            print("❌ Error: .env file exists but appears to have placeholder values")
            print("📝 Please edit the .env file and add your actual API keys")
            return False
    
    print("✅ Environment configuration looks good!")
    return True

def start_server():
    """Start the Flask backend server."""
    backend_dir = Path(__file__).parent / 'backend'
    
    if not check_environment():
        sys.exit(1)
    
    print("🚀 Starting MultiGenQA backend server...")
    print("📍 Server will be available at: http://localhost:5000")
    print("🔍 Health check: http://localhost:5000/api/health")
    print("📋 Available models: http://localhost:5000/api/models")
    print("\n" + "="*50)
    
    # Change to backend directory and start the server
    os.chdir(backend_dir)
    os.system('python app.py')

if __name__ == "__main__":
    start_server() 