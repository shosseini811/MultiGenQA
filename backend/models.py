"""
Database models for MultiGenQA application.

This file defines the database schema using SQLAlchemy ORM.
It includes models for users, conversations, and messages.
"""

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from datetime import datetime
from typing import List, Optional
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from flask import current_app

db = SQLAlchemy()

class User(db.Model):
    """
    Enhanced User model for storing user information with authentication.
    
    This model now supports proper user accounts with email/password authentication.
    """
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Authentication fields
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Profile fields
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    
    # Account status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    email_verification_token = db.Column(db.String(255), nullable=True)
    
    # Legacy field for backward compatibility (will be removed in future versions)
    session_id = db.Column(db.String(128), unique=True, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_active = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Password reset
    password_reset_token = db.Column(db.String(255), nullable=True)
    password_reset_expires = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    conversations = db.relationship('Conversation', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password: str) -> None:
        """
        Hash and set the user's password.
        
        Args:
            password: Plain text password to hash and store
        """
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        """
        Check if the provided password matches the stored hash.
        
        Args:
            password: Plain text password to verify
            
        Returns:
            bool: True if password matches, False otherwise
        """
        return check_password_hash(self.password_hash, password)
    
    def generate_auth_token(self, expires_in: int = 86400) -> str:
        """
        Generate a JWT authentication token for the user.
        
        Args:
            expires_in: Token expiration time in seconds (default: 24 hours)
            
        Returns:
            str: JWT token
        """
        import time
        # Use consistent timestamp for both iat and exp
        now = int(time.time())
        payload = {
            'user_id': self.id,
            'email': self.email,
            'exp': now + expires_in,
            'iat': now
        }
        return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    
    @staticmethod
    def verify_auth_token(token: str) -> Optional['User']:
        """
        Verify a JWT authentication token and return the user.
        
        Args:
            token: JWT token to verify
            
        Returns:
            User: User object if token is valid, None otherwise
        """
        try:
            # Decode with leeway to handle small time differences
            payload = jwt.decode(
                token, 
                current_app.config['SECRET_KEY'], 
                algorithms=['HS256'],
                leeway=10  # Allow 10 seconds leeway for time sync issues
            )
            user_id = payload.get('user_id')
            if user_id:
                user = User.query.get(user_id)
                if user and user.is_active:
                    print(f"✅ Token verification successful for user: {user.email}")
                    return user
                else:
                    print(f"❌ User not found or inactive for ID: {user_id}")
            else:
                print("❌ No user_id in token payload")
        except jwt.ExpiredSignatureError:
            print("❌ Token has expired")
        except jwt.InvalidTokenError as e:
            print(f"❌ Invalid token: {e}")
        except Exception as e:
            print(f"❌ Token verification error: {e}")
        return None
    
    def generate_verification_token(self) -> str:
        """
        Generate an email verification token.
        
        Returns:
            str: Verification token
        """
        token = str(uuid.uuid4())
        self.email_verification_token = token
        return token
    
    def generate_password_reset_token(self, expires_in: int = 3600) -> str:
        """
        Generate a password reset token.
        
        Args:
            expires_in: Token expiration time in seconds (default: 1 hour)
            
        Returns:
            str: Password reset token
        """
        token = str(uuid.uuid4())
        self.password_reset_token = token
        self.password_reset_expires = datetime.utcnow() + datetime.timedelta(seconds=expires_in)
        return token
    
    def verify_password_reset_token(self, token: str) -> bool:
        """
        Verify a password reset token.
        
        Args:
            token: Password reset token to verify
            
        Returns:
            bool: True if token is valid and not expired, False otherwise
        """
        return (self.password_reset_token == token and 
                self.password_reset_expires and 
                self.password_reset_expires > datetime.utcnow())
    
    @property
    def full_name(self) -> str:
        """Get the user's full name."""
        return f"{self.first_name} {self.last_name}"
    
    def to_dict(self, include_sensitive: bool = False) -> dict:
        """
        Convert user object to dictionary.
        
        Args:
            include_sensitive: Whether to include sensitive information
            
        Returns:
            dict: User data as dictionary
        """
        data = {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat(),
            'last_active': self.last_active.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        
        if include_sensitive:
            data.update({
                'email_verification_token': self.email_verification_token,
                'password_reset_token': self.password_reset_token,
                'password_reset_expires': self.password_reset_expires.isoformat() if self.password_reset_expires else None
            })
        
        return data

class Conversation(db.Model):
    """
    Conversation model for storing chat conversations.
    
    Each conversation belongs to a user and contains multiple messages.
    """
    __tablename__ = 'conversations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=True)  # Auto-generated from first message
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Relationships
    messages = db.relationship('Message', backref='conversation', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Conversation {self.id[:8]}... - {self.title}>'
    
    def to_dict(self, include_messages=False):
        result = {
            'id': self.id,
            'title': self.title,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active,
            'message_count': len(self.messages)
        }
        
        if include_messages:
            result['messages'] = [msg.to_dict() for msg in self.messages]
        
        return result

class Message(db.Model):
    """
    Message model for storing individual chat messages.
    
    Each message belongs to a conversation and can be from either user or assistant.
    """
    __tablename__ = 'messages'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(db.String(36), db.ForeignKey('conversations.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    model_used = db.Column(db.String(50), nullable=True)  # Which AI model was used
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Metadata
    token_count = db.Column(db.Integer, nullable=True)  # For usage tracking
    response_time = db.Column(db.Float, nullable=True)  # Response time in seconds
    
    def __repr__(self):
        return f'<Message {self.id[:8]}... - {self.role}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'content': self.content,
            'model_used': self.model_used,
            'timestamp': self.timestamp.isoformat(),
            'token_count': self.token_count,
            'response_time': self.response_time
        }

class APIUsage(db.Model):
    """
    API Usage tracking model for monitoring and billing.
    
    Tracks API calls, costs, and usage patterns.
    """
    __tablename__ = 'api_usage'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    model_name = db.Column(db.String(50), nullable=False)
    endpoint = db.Column(db.String(100), nullable=False)
    tokens_used = db.Column(db.Integer, nullable=True)
    cost_estimate = db.Column(db.Float, nullable=True)  # In USD
    response_time = db.Column(db.Float, nullable=False)
    status_code = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f'<APIUsage {self.model_name} - {self.status_code}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'model_name': self.model_name,
            'endpoint': self.endpoint,
            'tokens_used': self.tokens_used,
            'cost_estimate': self.cost_estimate,
            'response_time': self.response_time,
            'status_code': self.status_code,
            'timestamp': self.timestamp.isoformat()
        }

def init_db(app):
    """Initialize the database with the Flask app."""
    db.init_app(app)
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Create indexes for better performance
        with db.engine.connect() as conn:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp 
                ON messages(conversation_id, timestamp);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
                ON conversations(user_id, updated_at);
            """))
            
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_api_usage_user_timestamp 
                ON api_usage(user_id, timestamp);
            """))
            
            conn.commit()
        
        print("✅ Database initialized successfully!") 