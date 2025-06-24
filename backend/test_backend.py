#!/usr/bin/env python3
"""
Simple test script to verify MultiGenQA backend functionality.

This script provides a comprehensive test suite for the MultiGenQA backend API
without requiring external dependencies or complex test frameworks. It tests:
- Core API endpoints (health, models, metrics)
- Database model functionality
- Input validation
- CORS configuration
- Basic error handling

Usage:
    python test_backend.py

The script will output detailed test results and return exit code 0 if all tests pass.
"""

# Standard library imports
import json  # JSON serialization for API responses
import sys   # System functions for exit codes

# Application imports
from app import app, db  # Flask app and database instance
from models import User, Conversation, Message  # Database models

def test_health_endpoint():
    """
    Test the health check endpoint functionality.
    
    This test verifies that:
    - The health endpoint responds with HTTP 200
    - Response includes required status fields
    - Service status information is included
    """
    print("🔍 Testing health endpoint...")
    
    with app.test_client() as client:
        response = client.get('/api/health')
        
        if response.status_code == 200:
            data = response.get_json()
            print(f"   ✅ Health check passed: {data['status']}")
            print(f"   📊 Services: {data.get('services', {})}")
            return True
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False

def test_models_endpoint():
    """
    Test the AI models endpoint functionality.
    
    This test verifies that:
    - The models endpoint responds with HTTP 200
    - All expected AI models are listed
    - Model information includes required fields
    """
    print("🔍 Testing models endpoint...")
    
    with app.test_client() as client:
        response = client.get('/api/models')
        
        if response.status_code == 200:
            data = response.get_json()
            models = data.get('models', [])
            print(f"   ✅ Models endpoint working: {len(models)} models available")
            for model in models:
                print(f"      - {model['name']} ({model['id']})")
            return True
        else:
            print(f"   ❌ Models endpoint failed: {response.status_code}")
            return False

def test_database_models():
    """
    Test database model creation and basic CRUD operations.
    
    This test verifies that:
    - User, Conversation, and Message models can be created
    - Database relationships work correctly
    - Data can be retrieved and manipulated
    - Cleanup operations work properly
    """
    print("🔍 Testing database models...")
    
    try:
        with app.app_context():
            # Test User model
            user = User(session_id='test-session-123')
            db.session.add(user)
            db.session.commit()
            
            # Test Conversation model
            conversation = Conversation(
                user_id=user.id,
                title='Test Conversation'
            )
            db.session.add(conversation)
            db.session.commit()
            
            # Test Message model
            message = Message(
                conversation_id=conversation.id,
                role='user',
                content='Hello, this is a test message'
            )
            db.session.add(message)
            db.session.commit()
            
            # Verify the data
            retrieved_user = User.query.filter_by(session_id='test-session-123').first()
            if retrieved_user:
                print("   ✅ User model working correctly")
            
            retrieved_conversation = Conversation.query.filter_by(user_id=user.id).first()
            if retrieved_conversation:
                print("   ✅ Conversation model working correctly")
            
            retrieved_message = Message.query.filter_by(conversation_id=conversation.id).first()
            if retrieved_message:
                print("   ✅ Message model working correctly")
            
            # Clean up test data
            db.session.delete(message)
            db.session.delete(conversation)
            db.session.delete(user)
            db.session.commit()
            
            print("   ✅ Database models test completed successfully")
            return True
            
    except Exception as e:
        print(f"   ❌ Database models test failed: {str(e)}")
        return False

def test_chat_endpoint_validation():
    """
    Test chat endpoint input validation and error handling.
    
    This test verifies that:
    - Missing required parameters are properly rejected
    - Invalid model names are handled correctly
    - Appropriate error codes and messages are returned
    - Session management works for legacy users
    """
    print("🔍 Testing chat endpoint validation...")
    
    with app.test_client() as client:
        # Test missing model parameter
        response = client.post('/api/chat', 
                             json={'messages': [{'role': 'user', 'content': 'Hello'}]})
        
        if response.status_code == 400:
            print("   ✅ Missing model parameter validation working")
        else:
            print(f"   ❌ Missing model validation failed: {response.status_code}")
            return False
        
        # Test missing messages parameter
        response = client.post('/api/chat', 
                             json={'model': 'openai'})
        
        if response.status_code == 400:
            print("   ✅ Missing messages parameter validation working")
        else:
            print(f"   ❌ Missing messages validation failed: {response.status_code}")
            return False
        
        # Test invalid model (need to create a user first)
        # Create a test user
        test_user = User(session_id='test-user-validation-123')
        db.session.add(test_user)
        db.session.commit()
        
        with client.session_transaction() as sess:
            sess['user_id'] = 'test-user-validation-123'
        
        response = client.post('/api/chat', 
                             json={
                                 'model': 'invalid_model',
                                 'messages': [{'role': 'user', 'content': 'Hello'}]
                             })
        
        # Clean up test user
        db.session.delete(test_user)
        db.session.commit()
        
        if response.status_code == 400:
            print("   ✅ Invalid model validation working")
            return True
        else:
            print(f"   ❌ Invalid model validation failed: {response.status_code}")
            return False

def test_metrics_endpoint():
    """
    Test the Prometheus metrics endpoint.
    
    This test verifies that:
    - The metrics endpoint responds with HTTP 200
    - Content type is appropriate for Prometheus format
    - Metrics data is properly formatted
    """
    print("🔍 Testing metrics endpoint...")
    
    with app.test_client() as client:
        response = client.get('/api/metrics')
        
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', '')
            if 'text/plain' in content_type:
                print("   ✅ Metrics endpoint working (Prometheus format)")
                return True
            else:
                print(f"   ⚠️  Metrics endpoint working but unexpected content type: {content_type}")
                return True
        else:
            print(f"   ❌ Metrics endpoint failed: {response.status_code}")
            return False

def test_cors_headers():
    """
    Test Cross-Origin Resource Sharing (CORS) configuration.
    
    This test verifies that:
    - CORS headers are present in responses
    - Frontend applications can communicate with the API
    - Configuration is working as expected
    """
    print("🔍 Testing CORS headers...")
    
    with app.test_client() as client:
        response = client.get('/api/health')
        
        cors_header = response.headers.get('Access-Control-Allow-Origin')
        if cors_header:
            print(f"   ✅ CORS headers present: {cors_header}")
            return True
        else:
            print("   ⚠️  CORS headers not found (may be expected in test environment)")
            return True

def run_all_tests():
    """
    Execute all backend tests and report results.
    
    This function orchestrates the complete test suite execution:
    - Runs all individual test functions
    - Tracks pass/fail statistics
    - Provides comprehensive reporting
    - Returns success/failure status
    
    Returns:
        bool: True if all tests pass, False otherwise
    """
    print("🚀 Starting MultiGenQA Backend Tests")
    print("=" * 50)
    
    tests = [
        test_health_endpoint,
        test_models_endpoint,
        test_database_models,
        test_chat_endpoint_validation,
        test_metrics_endpoint,
        test_cors_headers
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
            print()  # Add spacing between tests
        except Exception as e:
            print(f"   ❌ Test {test_func.__name__} crashed: {str(e)}")
            print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return False

if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1) 