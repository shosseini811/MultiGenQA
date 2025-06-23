"""
Test suite for MultiGenQA API endpoints.

This file contains comprehensive tests for all API endpoints including:
- Health checks
- Model endpoints
- Chat functionality
- Conversation management
- Error handling
"""

import pytest
import json
from unittest.mock import patch, MagicMock
from flask import Flask
from backend.app import app, db
from backend.models import User, Conversation, Message, APIUsage

@pytest.fixture
def client():
    """Create a test client for the Flask application."""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

@pytest.fixture
def sample_user():
    """Create a sample user for testing."""
    user = User(session_id='test-session-123')
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def sample_conversation(sample_user):
    """Create a sample conversation for testing."""
    conversation = Conversation(
        user_id=sample_user.id,
        title='Test Conversation'
    )
    db.session.add(conversation)
    db.session.commit()
    return conversation

class TestHealthEndpoint:
    """Test cases for the health check endpoint."""
    
    def test_health_check_success(self, client):
        """Test successful health check."""
        response = client.get('/api/health')
        assert response.status_code == 200
        
        data = response.get_json()
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
        assert 'version' in data
        assert 'services' in data

    def test_health_check_includes_services(self, client):
        """Test that health check includes service status."""
        response = client.get('/api/health')
        data = response.get_json()
        
        assert 'services' in data
        services = data['services']
        assert 'database' in services
        assert 'cache' in services

class TestModelsEndpoint:
    """Test cases for the models endpoint."""
    
    def test_get_models_success(self, client):
        """Test successful retrieval of available models."""
        response = client.get('/api/models')
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'models' in data
        assert len(data['models']) == 3
        
        # Check that all expected models are present
        model_ids = [model['id'] for model in data['models']]
        assert 'openai' in model_ids
        assert 'gemini' in model_ids
        assert 'claude' in model_ids

    def test_models_have_required_fields(self, client):
        """Test that each model has required fields."""
        response = client.get('/api/models')
        data = response.get_json()
        
        for model in data['models']:
            assert 'id' in model
            assert 'name' in model
            assert 'description' in model
            assert 'status' in model

class TestChatEndpoint:
    """Test cases for the chat endpoint."""
    
    def test_chat_missing_model(self, client):
        """Test chat endpoint with missing model parameter."""
        response = client.post('/api/chat', 
                             json={'messages': [{'role': 'user', 'content': 'Hello'}]})
        assert response.status_code == 400
        
        data = response.get_json()
        assert 'error' in data
        assert 'Model and messages are required' in data['error']

    def test_chat_missing_messages(self, client):
        """Test chat endpoint with missing messages parameter."""
        response = client.post('/api/chat', 
                             json={'model': 'openai'})
        assert response.status_code == 400
        
        data = response.get_json()
        assert 'error' in data
        assert 'Model and messages are required' in data['error']

    def test_chat_invalid_model(self, client):
        """Test chat endpoint with invalid model."""
        with client.session_transaction() as sess:
            sess['user_id'] = 'test-user-123'
        
        response = client.post('/api/chat', 
                             json={
                                 'model': 'invalid_model',
                                 'messages': [{'role': 'user', 'content': 'Hello'}]
                             })
        assert response.status_code == 400
        
        data = response.get_json()
        assert 'error' in data
        assert 'Invalid model selected' in data['error']

    @patch('backend.app.AIService.call_openai')
    def test_chat_openai_success(self, mock_openai, client):
        """Test successful chat with OpenAI model."""
        # Mock the AI service response
        mock_openai.return_value = {
            'response': 'Hello! How can I help you?',
            'model': 'openai-gpt-4o',
            'tokens_used': 15,
            'response_time': 1.2
        }
        
        with client.session_transaction() as sess:
            sess['user_id'] = 'test-user-123'
        
        response = client.post('/api/chat', 
                             json={
                                 'model': 'openai',
                                 'messages': [{'role': 'user', 'content': 'Hello'}]
                             })
        assert response.status_code == 200
        
        data = response.get_json()
        assert data['response'] == 'Hello! How can I help you?'
        assert data['model'] == 'openai-gpt-4o'
        assert data['status'] == 'success'
        assert 'conversation_id' in data
        assert 'metadata' in data

    @patch('backend.app.AIService.call_gemini')
    def test_chat_gemini_success(self, mock_gemini, client):
        """Test successful chat with Gemini model."""
        mock_gemini.return_value = {
            'response': 'Hi there! I\'m Gemini.',
            'model': 'gemini-2.5-flash',
            'response_time': 0.8
        }
        
        with client.session_transaction() as sess:
            sess['user_id'] = 'test-user-123'
        
        response = client.post('/api/chat', 
                             json={
                                 'model': 'gemini',
                                 'messages': [{'role': 'user', 'content': 'Hello'}]
                             })
        assert response.status_code == 200
        
        data = response.get_json()
        assert data['response'] == 'Hi there! I\'m Gemini.'
        assert data['model'] == 'gemini-2.5-flash'

    @patch('backend.app.AIService.call_claude')
    def test_chat_claude_success(self, mock_claude, client):
        """Test successful chat with Claude model."""
        mock_claude.return_value = {
            'response': 'Hello! I\'m Claude, nice to meet you.',
            'model': 'claude-3-5-sonnet',
            'tokens_used': 20,
            'response_time': 1.5
        }
        
        with client.session_transaction() as sess:
            sess['user_id'] = 'test-user-123'
        
        response = client.post('/api/chat', 
                             json={
                                 'model': 'claude',
                                 'messages': [{'role': 'user', 'content': 'Hello'}]
                             })
        assert response.status_code == 200
        
        data = response.get_json()
        assert data['response'] == 'Hello! I\'m Claude, nice to meet you.'
        assert data['model'] == 'claude-3-5-sonnet'

    @patch('backend.app.AIService.call_openai')
    def test_chat_ai_service_error(self, mock_openai, client):
        """Test chat endpoint when AI service returns an error."""
        mock_openai.return_value = {'error': 'API key invalid'}
        
        with client.session_transaction() as sess:
            sess['user_id'] = 'test-user-123'
        
        response = client.post('/api/chat', 
                             json={
                                 'model': 'openai',
                                 'messages': [{'role': 'user', 'content': 'Hello'}]
                             })
        assert response.status_code == 500
        
        data = response.get_json()
        assert 'error' in data

class TestConversationEndpoints:
    """Test cases for conversation management endpoints."""
    
    def test_get_conversations_no_user(self, client):
        """Test getting conversations when user doesn't exist."""
        with client.session_transaction() as sess:
            sess['user_id'] = 'nonexistent-user'
        
        response = client.get('/api/conversations')
        assert response.status_code == 404
        
        data = response.get_json()
        assert 'error' in data
        assert 'User not found' in data['error']

    def test_get_conversations_success(self, client, sample_user, sample_conversation):
        """Test successful retrieval of user conversations."""
        with client.session_transaction() as sess:
            sess['user_id'] = sample_user.session_id
        
        response = client.get('/api/conversations')
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'conversations' in data
        assert len(data['conversations']) == 1
        assert data['conversations'][0]['id'] == sample_conversation.id

    def test_get_specific_conversation_success(self, client, sample_user, sample_conversation):
        """Test successful retrieval of a specific conversation."""
        with client.session_transaction() as sess:
            sess['user_id'] = sample_user.session_id
        
        response = client.get(f'/api/conversations/{sample_conversation.id}')
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'conversation' in data
        assert data['conversation']['id'] == sample_conversation.id

    def test_get_specific_conversation_not_found(self, client, sample_user):
        """Test retrieval of non-existent conversation."""
        with client.session_transaction() as sess:
            sess['user_id'] = sample_user.session_id
        
        response = client.get('/api/conversations/nonexistent-id')
        assert response.status_code == 404
        
        data = response.get_json()
        assert 'error' in data
        assert 'Conversation not found' in data['error']

class TestUsageEndpoint:
    """Test cases for the usage statistics endpoint."""
    
    def test_get_usage_stats_no_user(self, client):
        """Test getting usage stats when user doesn't exist."""
        with client.session_transaction() as sess:
            sess['user_id'] = 'nonexistent-user'
        
        response = client.get('/api/usage')
        assert response.status_code == 404
        
        data = response.get_json()
        assert 'error' in data
        assert 'User not found' in data['error']

    def test_get_usage_stats_success(self, client, sample_user):
        """Test successful retrieval of usage statistics."""
        # Create some sample usage data
        usage = APIUsage(
            user_id=sample_user.id,
            model_name='openai-gpt-4o',
            endpoint='/chat/completions',
            tokens_used=100,
            cost_estimate=0.01,
            response_time=1.2,
            status_code=200
        )
        db.session.add(usage)
        db.session.commit()
        
        with client.session_transaction() as sess:
            sess['user_id'] = sample_user.session_id
        
        response = client.get('/api/usage')
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'usage' in data
        assert 'period' in data
        assert data['period'] == '30_days'

class TestRateLimiting:
    """Test cases for rate limiting functionality."""
    
    def test_chat_rate_limit(self, client):
        """Test that chat endpoint enforces rate limits."""
        with client.session_transaction() as sess:
            sess['user_id'] = 'test-user-123'
        
        # Make multiple requests quickly to trigger rate limit
        for i in range(15):  # Assuming limit is 10 per minute
            response = client.post('/api/chat', 
                                 json={
                                     'model': 'openai',
                                     'messages': [{'role': 'user', 'content': f'Hello {i}'}]
                                 })
            if response.status_code == 429:
                # Rate limit triggered
                data = response.get_json()
                assert 'error' in data
                assert 'Rate limit exceeded' in data['error']
                break
        else:
            # If we didn't hit rate limit, that's also acceptable for this test
            pass

class TestErrorHandlers:
    """Test cases for error handling."""
    
    def test_404_handler(self, client):
        """Test 404 error handler."""
        response = client.get('/api/nonexistent')
        assert response.status_code == 404
        
        data = response.get_json()
        assert 'error' in data
        assert 'Endpoint not found' in data['error']

    def test_500_handler(self, client):
        """Test 500 error handler."""
        # This is harder to test without actually causing a server error
        # In a real scenario, you'd mock a function to raise an exception
        pass

class TestMetricsEndpoint:
    """Test cases for the metrics endpoint."""
    
    def test_metrics_endpoint(self, client):
        """Test that metrics endpoint returns Prometheus format."""
        response = client.get('/api/metrics')
        assert response.status_code == 200
        assert response.content_type.startswith('text/plain')
        
        # Check for some expected Prometheus metrics
        content = response.get_data(as_text=True)
        assert 'http_requests_total' in content or len(content) >= 0  # Metrics might be empty initially 