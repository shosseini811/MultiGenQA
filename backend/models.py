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

db = SQLAlchemy()

class User(db.Model):
    """
    User model for storing user information.
    
    In a production app, you'd integrate this with an authentication system.
    For now, we'll use simple session-based identification.
    """
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = db.Column(db.String(128), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_active = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    conversations = db.relationship('Conversation', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.id[:8]}...>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat(),
            'last_active': self.last_active.isoformat()
        }

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