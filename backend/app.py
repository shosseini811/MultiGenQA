from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flask_caching import Cache
import os
from dotenv import load_dotenv
import openai
import google.generativeai as genai
import anthropic
from typing import List, Dict, Any, Optional
import logging
import traceback
import json
import time
from datetime import datetime, timedelta
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import uuid
import re
from functools import wraps
from email_validator import validate_email, EmailNotValidError

# Import our database models
from models import db, init_db, User, Conversation, Message, APIUsage

# Set up structured logging
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'request_id': getattr(record, 'request_id', None)
        }
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        return json.dumps(log_entry)

# Configure logging
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger = logging.getLogger(__name__)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Load environment variables from .env file
load_dotenv()
logger.info("Loading environment variables...")

# Create Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///multigenqa.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Cache configuration
app.config['CACHE_TYPE'] = 'redis' if os.getenv('REDIS_URL') else 'simple'
app.config['CACHE_REDIS_URL'] = os.getenv('REDIS_URL', 'redis://localhost:6379')

# Initialize extensions
cache = Cache(app)

# CORS configuration
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, origins=cors_origins, supports_credentials=True)

# Security headers with Talisman
csp = {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline'",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: https:",
    'connect-src': "'self' https://api.openai.com https://generativelanguage.googleapis.com https://api.anthropic.com"
}

if os.getenv('FLASK_ENV') == 'production':
    Talisman(app, 
             force_https=True,
             strict_transport_security=True,
             content_security_policy=csp)

# Rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000 per hour", "100 per minute"],
    storage_uri=os.getenv('REDIS_URL', 'memory://')
)
limiter.init_app(app)

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
AI_REQUEST_COUNT = Counter('ai_requests_total', 'Total AI API requests', ['model', 'status'])
AI_REQUEST_DURATION = Histogram('ai_request_duration_seconds', 'AI API request duration', ['model'])

# Initialize database
init_db(app)

# Initialize AI clients with proper error handling
try:
    openai.api_key = os.getenv('OPENAI_API_KEY')
    logger.info("OpenAI API key loaded successfully")
except Exception as e:
    logger.error(f"Failed to load OpenAI API key: {e}")

try:
    genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
    logger.info("Google API key configured successfully")
except Exception as e:
    logger.error(f"Failed to configure Google API key: {e}")

try:
    anthropic_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
    logger.info("Anthropic client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Anthropic client: {e}")

# Authentication decorator
def auth_required(f):
    """
    Decorator to require authentication for endpoints.
    
    This decorator checks for a valid JWT token in the Authorization header.
    If the token is valid, it sets the current user and continues with the request.
    If not, it returns a 401 Unauthorized response.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                # Extract token from "Bearer <token>" format
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Invalid authorization header format'}), 401
        
        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401
        
        try:
            current_user = User.verify_auth_token(token)
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'Invalid or expired token'}), 401
            
            # Set current user for the request
            request.current_user = current_user
            
            # Update last active time
            current_user.last_active = datetime.utcnow()
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return jsonify({'error': 'Token verification failed'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

# Utility functions for validation
def validate_password(password: str) -> List[str]:
    """
    Validate password strength.
    
    Returns a list of error messages if password is invalid.
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one number")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    return errors

def validate_user_input(data: dict) -> Dict[str, List[str]]:
    """
    Validate user registration input.
    
    Returns a dictionary with field names as keys and error lists as values.
    """
    errors = {}
    
    # Validate email
    email = data.get('email', '').strip().lower()
    if not email:
        errors['email'] = ['Email is required']
    else:
        try:
            validate_email(email)
        except EmailNotValidError as e:
            errors['email'] = [str(e)]
    
    # Validate password
    password = data.get('password', '')
    if not password:
        errors['password'] = ['Password is required']
    else:
        password_errors = validate_password(password)
        if password_errors:
            errors['password'] = password_errors
    
    # Validate names
    first_name = data.get('first_name', '').strip()
    if not first_name:
        errors['first_name'] = ['First name is required']
    elif len(first_name) < 2:
        errors['first_name'] = ['First name must be at least 2 characters long']
    
    last_name = data.get('last_name', '').strip()
    if not last_name:
        errors['last_name'] = ['Last name is required']
    elif len(last_name) < 2:
        errors['last_name'] = ['Last name must be at least 2 characters long']
    
    return errors

# Authentication endpoints
@app.route('/api/auth/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    """
    User registration endpoint.
    
    Creates a new user account with email and password.
    """
    try:
        data = request.get_json()
        
        # Validate input
        validation_errors = validate_user_input(data)
        if validation_errors:
            return jsonify({'errors': validation_errors}), 400
        
        email = data['email'].strip().lower()
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'errors': {'email': ['User with this email already exists']}}), 409
        
        # Create new user
        user = User(
            email=email,
            first_name=data['first_name'].strip(),
            last_name=data['last_name'].strip()
        )
        user.set_password(data['password'])
        
        # Generate email verification token
        verification_token = user.generate_verification_token()
        
        db.session.add(user)
        db.session.commit()
        
        logger.info(f"New user registered: {email}")
        
        # In a real application, you would send an email verification here
        # For now, we'll just return the token for testing
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'verification_token': verification_token  # Remove this in production
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    """
    User login endpoint.
    
    Authenticates user with email and password, returns JWT token.
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        user.last_active = datetime.utcnow()
        db.session.commit()
        
        # Generate JWT token
        token = user.generate_auth_token()
        
        logger.info(f"User logged in: {email}")
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/logout', methods=['POST'])
@auth_required
def logout():
    """
    User logout endpoint.
    
    In a JWT-based system, logout is handled client-side by removing the token.
    This endpoint is mainly for logging purposes.
    """
    try:
        user = request.current_user
        logger.info(f"User logged out: {user.email}")
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Logout failed'}), 500

@app.route('/api/auth/me', methods=['GET'])
@auth_required
def get_current_user():
    """
    Get current user information.
    
    Returns the current authenticated user's profile.
    """
    try:
        user = request.current_user
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        return jsonify({'error': 'Failed to get user information'}), 500

@app.route('/api/auth/verify-email', methods=['POST'])
@limiter.limit("5 per minute")
def verify_email():
    """
    Email verification endpoint.
    
    Verifies user's email address using the verification token.
    """
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Verification token is required'}), 400
        
        user = User.query.filter_by(email_verification_token=token).first()
        
        if not user:
            return jsonify({'error': 'Invalid verification token'}), 400
        
        user.is_verified = True
        user.email_verification_token = None
        db.session.commit()
        
        logger.info(f"Email verified for user: {user.email}")
        
        return jsonify({'message': 'Email verified successfully'}), 200
        
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        return jsonify({'error': 'Email verification failed'}), 500

# Request middleware (updated for new authentication)
@app.before_request
def before_request():
    # Generate request ID for tracing
    request.request_id = str(uuid.uuid4())[:8]
    
    # Skip authentication setup for auth endpoints
    if request.endpoint and request.endpoint.startswith('auth'):
        return
    
    # For backward compatibility, maintain session-based users for now
    # This will be removed once all users migrate to the new system
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
        
        # Create legacy user record
        user = User(
            session_id=session['user_id'],
            email=f"legacy-{session['user_id'][:8]}@example.com",
            first_name="Legacy",
            last_name="User"
        )
        user.set_password("temporary-password")
        db.session.add(user)
        try:
            db.session.commit()
        except Exception as e:
            logger.error(f"Failed to create legacy user: {e}")
            db.session.rollback()

@app.after_request
def after_request(response):
    # Record metrics
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.endpoint or 'unknown',
        status=response.status_code
    ).inc()
    
    return response

class AIService:
    """Enhanced AI service with monitoring and error handling."""
    
    @staticmethod
    def call_openai(messages: List[Dict[str, str]], user_id: str) -> Dict[str, Any]:
        """Send messages to OpenAI GPT-4o and get a response with monitoring."""
        start_time = time.time()
        
        try:
            logger.info(f"Calling OpenAI with {len(messages)} messages", extra={'request_id': request.request_id})
            
            response = openai.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            
            result = response.choices[0].message.content
            response_time = time.time() - start_time
            
            # Record usage
            AIService._record_usage(
                user_id=user_id,
                model_name='openai-gpt-4o',
                endpoint='/chat/completions',
                tokens_used=response.usage.total_tokens if hasattr(response, 'usage') else None,
                response_time=response_time,
                status_code=200
            )
            
            AI_REQUEST_COUNT.labels(model='openai', status='success').inc()
            AI_REQUEST_DURATION.labels(model='openai').observe(response_time)
            
            logger.info(f"OpenAI response received: {len(result)} characters", 
                       extra={'request_id': request.request_id})
            
            return {
                'response': result,
                'model': 'openai-gpt-4o',
                'tokens_used': response.usage.total_tokens if hasattr(response, 'usage') else None,
                'response_time': response_time
            }
            
        except Exception as e:
            response_time = time.time() - start_time
            error_msg = f"Error calling OpenAI: {str(e)}"
            
            # Record failed usage
            AIService._record_usage(
                user_id=user_id,
                model_name='openai-gpt-4o',
                endpoint='/chat/completions',
                response_time=response_time,
                status_code=500
            )
            
            AI_REQUEST_COUNT.labels(model='openai', status='error').inc()
            
            logger.error(error_msg, extra={'request_id': request.request_id})
            logger.error(traceback.format_exc())
            
            return {'error': error_msg}
    
    @staticmethod
    def call_gemini(messages: List[Dict[str, str]], user_id: str) -> Dict[str, Any]:
        """Send messages to Google Gemini and get a response with monitoring."""
        start_time = time.time()
        
        try:
            logger.info(f"Calling Gemini with {len(messages)} messages", 
                       extra={'request_id': request.request_id})
            
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Convert our message format to Gemini's format
            user_messages = [msg['content'] for msg in messages if msg['role'] == 'user']
            prompt = '\n'.join(user_messages)
            
            response = model.generate_content(prompt)
            result = response.text
            response_time = time.time() - start_time
            
            # Record usage
            AIService._record_usage(
                user_id=user_id,
                model_name='gemini-2.5-flash',
                endpoint='/generate',
                response_time=response_time,
                status_code=200
            )
            
            AI_REQUEST_COUNT.labels(model='gemini', status='success').inc()
            AI_REQUEST_DURATION.labels(model='gemini').observe(response_time)
            
            logger.info(f"Gemini response received: {len(result)} characters", 
                       extra={'request_id': request.request_id})
            
            return {
                'response': result,
                'model': 'gemini-2.5-flash',
                'response_time': response_time
            }
            
        except Exception as e:
            response_time = time.time() - start_time
            error_msg = f"Error calling Gemini: {str(e)}"
            
            AIService._record_usage(
                user_id=user_id,
                model_name='gemini-2.5-flash',
                endpoint='/generate',
                response_time=response_time,
                status_code=500
            )
            
            AI_REQUEST_COUNT.labels(model='gemini', status='error').inc()
            
            logger.error(error_msg, extra={'request_id': request.request_id})
            logger.error(traceback.format_exc())
            
            return {'error': error_msg}
    
    @staticmethod
    def call_claude(messages: List[Dict[str, str]], user_id: str) -> Dict[str, Any]:
        """Send messages to Anthropic Claude and get a response with monitoring."""
        start_time = time.time()
        
        try:
            logger.info(f"Calling Claude with {len(messages)} messages", 
                       extra={'request_id': request.request_id})
            
            # Filter out system messages for Claude (if any)
            filtered_messages = [msg for msg in messages if msg['role'] in ['user', 'assistant']]
            
            response = anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                messages=filtered_messages
            )
            
            result = response.content[0].text
            response_time = time.time() - start_time
            
            # Record usage
            AIService._record_usage(
                user_id=user_id,
                model_name='claude-3-5-sonnet',
                endpoint='/messages',
                tokens_used=response.usage.input_tokens + response.usage.output_tokens if hasattr(response, 'usage') else None,
                response_time=response_time,
                status_code=200
            )
            
            AI_REQUEST_COUNT.labels(model='claude', status='success').inc()
            AI_REQUEST_DURATION.labels(model='claude').observe(response_time)
            
            logger.info(f"Claude response received: {len(result)} characters", 
                       extra={'request_id': request.request_id})
            
            return {
                'response': result,
                'model': 'claude-3-5-sonnet',
                'tokens_used': response.usage.input_tokens + response.usage.output_tokens if hasattr(response, 'usage') else None,
                'response_time': response_time
            }
            
        except Exception as e:
            response_time = time.time() - start_time
            error_msg = f"Error calling Claude: {str(e)}"
            
            AIService._record_usage(
                user_id=user_id,
                model_name='claude-3-5-sonnet',
                endpoint='/messages',
                response_time=response_time,
                status_code=500
            )
            
            AI_REQUEST_COUNT.labels(model='claude', status='error').inc()
            
            logger.error(error_msg, extra={'request_id': request.request_id})
            logger.error(traceback.format_exc())
            
            return {'error': error_msg}
    
    @staticmethod
    def _record_usage(user_id: str, model_name: str, endpoint: str, 
                     response_time: float, status_code: int, 
                     tokens_used: int = None, cost_estimate: float = None):
        """Record API usage for monitoring and billing."""
        try:
            usage = APIUsage(
                user_id=user_id,
                model_name=model_name,
                endpoint=endpoint,
                tokens_used=tokens_used,
                cost_estimate=cost_estimate,
                response_time=response_time,
                status_code=status_code
            )
            db.session.add(usage)
            db.session.commit()
        except Exception as e:
            logger.error(f"Failed to record API usage: {e}")
            db.session.rollback()

@app.route('/api/chat', methods=['POST'])
@auth_required
@limiter.limit("10 per minute")
def chat():
    """Enhanced chat endpoint with conversation persistence and authentication."""
    try:
        with REQUEST_DURATION.time():
            # Get data from the request
            data = request.json
            model = data.get('model')
            messages = data.get('messages', [])
            conversation_id = data.get('conversation_id')
            
            logger.info(f"Chat request received - Model: {model}, Messages: {len(messages)}", 
                       extra={'request_id': request.request_id})
            
            # Validate the request
            if not model or not messages:
                error_msg = 'Model and messages are required'
                logger.warning(error_msg, extra={'request_id': request.request_id})
                return jsonify({'error': error_msg}), 400
            
            # Get authenticated user
            user = request.current_user
            
            # Get or create conversation
            if conversation_id:
                conversation = Conversation.query.filter_by(
                    id=conversation_id, 
                    user_id=user.id
                ).first()
                if not conversation:
                    return jsonify({'error': 'Conversation not found'}), 404
            else:
                # Create new conversation
                conversation = Conversation(
                    user_id=user.id,
                    title=messages[0]['content'][:50] + '...' if messages else 'New Conversation'
                )
                db.session.add(conversation)
                db.session.commit()
            
            # Save user message
            if messages:
                last_message = messages[-1]
                if last_message['role'] == 'user':
                    user_msg = Message(
                        conversation_id=conversation.id,
                        role='user',
                        content=last_message['content']
                    )
                    db.session.add(user_msg)
                    db.session.commit()
            
            # Call the appropriate AI service
            if model == 'openai':
                ai_response = AIService.call_openai(messages, user.id)
            elif model == 'gemini':
                ai_response = AIService.call_gemini(messages, user.id)
            elif model == 'claude':
                ai_response = AIService.call_claude(messages, user.id)
            else:
                error_msg = f'Invalid model selected: {model}'
                logger.warning(error_msg, extra={'request_id': request.request_id})
                return jsonify({'error': error_msg}), 400
            
            # Handle AI service errors
            if 'error' in ai_response:
                return jsonify(ai_response), 500
            
            # Save AI response
            ai_msg = Message(
                conversation_id=conversation.id,
                role='assistant',
                content=ai_response['response'],
                model_used=ai_response['model'],
                token_count=ai_response.get('tokens_used'),
                response_time=ai_response.get('response_time')
            )
            db.session.add(ai_msg)
            
            # Update conversation timestamp
            conversation.updated_at = datetime.utcnow()
            db.session.commit()
            
            logger.info(f"Successfully processed chat request for {model}", 
                       extra={'request_id': request.request_id})
            
            # Return the response with conversation info
            return jsonify({
                'response': ai_response['response'],
                'model': ai_response['model'],
                'conversation_id': conversation.id,
                'status': 'success',
                'metadata': {
                    'tokens_used': ai_response.get('tokens_used'),
                    'response_time': ai_response.get('response_time')
                }
            })
            
    except Exception as e:
        error_msg = f"Unexpected error in chat endpoint: {str(e)}"
        logger.error(error_msg, extra={'request_id': request.request_id})
        logger.error(traceback.format_exc())
        return jsonify({'error': error_msg}), 500

@app.route('/api/conversations', methods=['GET'])
@auth_required
@limiter.limit("30 per minute")
def get_conversations():
    """Get user's conversation history."""
    try:
        user = request.current_user
        
        conversations = Conversation.query.filter_by(
            user_id=user.id, 
            is_active=True
        ).order_by(Conversation.updated_at.desc()).limit(50).all()
        
        return jsonify({
            'conversations': [conv.to_dict() for conv in conversations]
        })
        
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        return jsonify({'error': 'Failed to fetch conversations'}), 500

@app.route('/api/conversations/<conversation_id>', methods=['GET'])
@auth_required
@limiter.limit("30 per minute")
def get_conversation(conversation_id):
    """Get a specific conversation with messages."""
    try:
        user = request.current_user
        
        conversation = Conversation.query.filter_by(
            id=conversation_id,
            user_id=user.id
        ).first()
        
        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404
        
        return jsonify({
            'conversation': conversation.to_dict(include_messages=True)
        })
        
    except Exception as e:
        logger.error(f"Error fetching conversation: {str(e)}")
        return jsonify({'error': 'Failed to fetch conversation'}), 500

@app.route('/api/models', methods=['GET'])
@cache.cached(timeout=300)  # Cache for 5 minutes
def get_models():
    """Return the list of available AI models."""
    logger.debug("Models endpoint called", extra={'request_id': getattr(request, 'request_id', None)})
    models = [
        {
            'id': 'openai',
            'name': 'OpenAI GPT-4o',
            'description': 'Advanced language model from OpenAI',
            'status': 'active'
        },
        {
            'id': 'gemini',
            'name': 'Google Gemini 2.5 Flash',
            'description': 'Google\'s powerful multimodal AI',
            'status': 'active'
        },
        {
            'id': 'claude',
            'name': 'Claude 3.5 Sonnet',
            'description': 'Anthropic\'s helpful and harmless AI',
            'status': 'active'
        }
    ]
    return jsonify({'models': models})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Enhanced health check endpoint with service status."""
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0',
        'request_id': getattr(request, 'request_id', None),
        'services': {}
    }
    
    # Check database connection
    try:
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        health_status['services']['database'] = 'healthy'
    except Exception as e:
        health_status['services']['database'] = 'unhealthy'
        health_status['status'] = 'degraded'
        logger.error(f"Database health check failed: {e}")
    
    # Check AI services (basic connectivity)
    ai_services = {
        'openai': bool(os.getenv('OPENAI_API_KEY')),
        'gemini': bool(os.getenv('GOOGLE_API_KEY')),
        'claude': bool(os.getenv('ANTHROPIC_API_KEY'))
    }
    
    for service, configured in ai_services.items():
        health_status['services'][service] = 'configured' if configured else 'not_configured'
    
    # Check cache
    try:
        cache.set('health_check', 'ok', timeout=1)
        cache.get('health_check')
        health_status['services']['cache'] = 'healthy'
    except Exception as e:
        health_status['services']['cache'] = 'unhealthy'
        logger.error(f"Cache health check failed: {e}")
    
    return jsonify(health_status)

@app.route('/api/metrics', methods=['GET'])
def metrics():
    """Prometheus metrics endpoint."""
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

@app.route('/api/usage', methods=['GET'])
@auth_required
@limiter.limit("10 per minute")
def get_usage_stats():
    """Get user's API usage statistics."""
    try:
        user = request.current_user
        
        # Get usage for the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        usage_stats = db.session.query(
            APIUsage.model_name,
            db.func.count(APIUsage.id).label('request_count'),
            db.func.sum(APIUsage.tokens_used).label('total_tokens'),
            db.func.sum(APIUsage.cost_estimate).label('total_cost'),
            db.func.avg(APIUsage.response_time).label('avg_response_time')
        ).filter(
            APIUsage.user_id == user.id,
            APIUsage.timestamp >= thirty_days_ago
        ).group_by(APIUsage.model_name).all()
        
        stats = []
        for stat in usage_stats:
            stats.append({
                'model': stat.model_name,
                'requests': stat.request_count,
                'tokens': stat.total_tokens or 0,
                'cost': round(stat.total_cost or 0, 4),
                'avg_response_time': round(stat.avg_response_time or 0, 3)
            })
        
        return jsonify({
            'period': '30_days',
            'usage': stats
        })
        
    except Exception as e:
        logger.error(f"Error fetching usage stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch usage statistics'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({
        'error': 'Rate limit exceeded',
        'message': 'Too many requests. Please try again later.'
    }), 429

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info("Starting MultiGenQA API server...")
    
    # Run with Gunicorn in production, Flask dev server in development
    if os.getenv('FLASK_ENV') == 'production':
        # This will be handled by Gunicorn in production
        pass
    else:
        # Development server
        app.run(debug=True, host='0.0.0.0', port=5001) 