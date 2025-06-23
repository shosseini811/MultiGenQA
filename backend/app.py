from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import openai
import google.generativeai as genai
import anthropic
from typing import List, Dict, Any
import logging
import traceback

# Set up logging for debugging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()
logger.info("Loading environment variables...")

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes so our React app can talk to this API

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

class AIService:
    """
    This class handles communication with different AI services.
    Think of it as a translator that speaks to each AI service in their own language.
    """
    
    @staticmethod
    def call_openai(messages: List[Dict[str, str]]) -> str:
        """
        Send messages to OpenAI GPT-4o and get a response.
        
        Args:
            messages: A list of message dictionaries with 'role' and 'content'
            
        Returns:
            The AI's response as a string
        """
        try:
            logger.debug(f"Calling OpenAI with {len(messages)} messages")
            response = openai.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            result = response.choices[0].message.content
            logger.debug(f"OpenAI response received: {len(result)} characters")
            return result
        except Exception as e:
            error_msg = f"Error calling OpenAI: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            return error_msg
    
    @staticmethod
    def call_gemini(messages: List[Dict[str, str]]) -> str:
        """
        Send messages to Google Gemini and get a response.
        
        Args:
            messages: A list of message dictionaries with 'role' and 'content'
            
        Returns:
            The AI's response as a string
        """
        try:
            logger.debug(f"Calling Gemini with {len(messages)} messages")
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Convert our message format to Gemini's format
            # Gemini expects just the user messages, not the system/assistant ones
            user_messages = [msg['content'] for msg in messages if msg['role'] == 'user']
            prompt = '\n'.join(user_messages)
            logger.debug(f"Gemini prompt: {prompt[:100]}...")
            
            response = model.generate_content(prompt)
            result = response.text
            logger.debug(f"Gemini response received: {len(result)} characters")
            return result
        except Exception as e:
            error_msg = f"Error calling Gemini: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            return error_msg
    
    @staticmethod
    def call_claude(messages: List[Dict[str, str]]) -> str:
        """
        Send messages to Anthropic Claude and get a response.
        
        Args:
            messages: A list of message dictionaries with 'role' and 'content'
            
        Returns:
            The AI's response as a string
        """
        try:
            logger.debug(f"Calling Claude with {len(messages)} messages")
            
            # Filter out system messages for Claude (if any)
            filtered_messages = [msg for msg in messages if msg['role'] in ['user', 'assistant']]
            logger.debug(f"Filtered messages for Claude: {len(filtered_messages)}")
            
            response = anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",  # Updated to latest Claude model
                max_tokens=1000,
                messages=filtered_messages
            )
            result = response.content[0].text
            logger.debug(f"Claude response received: {len(result)} characters")
            return result
        except Exception as e:
            error_msg = f"Error calling Claude: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            return error_msg

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint that receives messages and returns AI responses.
    
    Expected JSON format:
    {
        "model": "openai" | "gemini" | "claude",
        "messages": [
            {"role": "user", "content": "Hello!"},
            {"role": "assistant", "content": "Hi there!"},
            {"role": "user", "content": "How are you?"}
        ]
    }
    """
    try:
        # Get data from the request
        data = request.json
        model = data.get('model')
        messages = data.get('messages', [])
        
        logger.info(f"Chat request received - Model: {model}, Messages: {len(messages)}")
        logger.debug(f"Request data: {data}")
        
        # Validate the request
        if not model or not messages:
            error_msg = 'Model and messages are required'
            logger.warning(error_msg)
            return jsonify({'error': error_msg}), 400
        
        # Call the appropriate AI service based on the selected model
        if model == 'openai':
            response = AIService.call_openai(messages)
        elif model == 'gemini':
            response = AIService.call_gemini(messages)
        elif model == 'claude':
            response = AIService.call_claude(messages)
        else:
            error_msg = f'Invalid model selected: {model}'
            logger.warning(error_msg)
            return jsonify({'error': error_msg}), 400
        
        logger.info(f"Successfully processed chat request for {model}")
        
        # Return the response
        return jsonify({
            'response': response,
            'model': model,
            'status': 'success'
        })
        
    except Exception as e:
        error_msg = f"Unexpected error in chat endpoint: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        return jsonify({'error': error_msg}), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    """
    Return the list of available AI models.
    """
    logger.debug("Models endpoint called")
    models = [
        {
            'id': 'openai',
            'name': 'OpenAI GPT-4o',
            'description': 'Advanced language model from OpenAI'
        },
        {
            'id': 'gemini',
            'name': 'Google Gemini 2.5 Flash',
            'description': 'Google\'s powerful multimodal AI'
        },
        {
            'id': 'claude',
            'name': 'Claude 3.5 Sonnet',
            'description': 'Anthropic\'s helpful and harmless AI'
        }
    ]
    return jsonify({'models': models})

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint to verify the API is running.
    """
    logger.debug("Health check called")
    return jsonify({'status': 'healthy', 'message': 'MultiGenQA API is running!'})

if __name__ == '__main__':
    logger.info("Starting MultiGenQA API server...")
    # Run the Flask app in debug mode
    app.run(debug=True, host='0.0.0.0', port=5001) 