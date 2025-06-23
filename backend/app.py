from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import openai
import google.generativeai as genai
import anthropic
from typing import List, Dict, Any

# Load environment variables from .env file
load_dotenv()

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes so our React app can talk to this API

# Initialize AI clients
openai.api_key = os.getenv('OPENAI_API_KEY')
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
anthropic_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

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
            response = openai.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error calling OpenAI: {str(e)}"
    
    @staticmethod
    def call_gemini(messages: List[Dict[str, str]]) -> str:
        """
        Send messages to Google Gemini Pro and get a response.
        
        Args:
            messages: A list of message dictionaries with 'role' and 'content'
            
        Returns:
            The AI's response as a string
        """
        try:
            model = genai.GenerativeModel('gemini-pro')
            
            # Convert our message format to Gemini's format
            # Gemini expects just the user messages, not the system/assistant ones
            user_messages = [msg['content'] for msg in messages if msg['role'] == 'user']
            prompt = '\n'.join(user_messages)
            
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error calling Gemini: {str(e)}"
    
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
            response = anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                messages=messages
            )
            return response.content[0].text
        except Exception as e:
            return f"Error calling Claude: {str(e)}"

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
        
        # Validate the request
        if not model or not messages:
            return jsonify({'error': 'Model and messages are required'}), 400
        
        # Call the appropriate AI service based on the selected model
        if model == 'openai':
            response = AIService.call_openai(messages)
        elif model == 'gemini':
            response = AIService.call_gemini(messages)
        elif model == 'claude':
            response = AIService.call_claude(messages)
        else:
            return jsonify({'error': 'Invalid model selected'}), 400
        
        # Return the response
        return jsonify({
            'response': response,
            'model': model,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    """
    Return the list of available AI models.
    """
    models = [
        {
            'id': 'openai',
            'name': 'OpenAI GPT-4o',
            'description': 'Advanced language model from OpenAI'
        },
        {
            'id': 'gemini',
            'name': 'Google Gemini Pro 2.5',
            'description': 'Google\'s powerful multimodal AI'
        },
        {
            'id': 'claude',
            'name': 'Claude Sonnet 4',
            'description': 'Anthropic\'s helpful and harmless AI'
        }
    ]
    return jsonify({'models': models})

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint to verify the API is running.
    """
    return jsonify({'status': 'healthy', 'message': 'MultiGenQA API is running!'})

if __name__ == '__main__':
    # Run the Flask app in debug mode
    app.run(debug=True, host='0.0.0.0', port=5000) 