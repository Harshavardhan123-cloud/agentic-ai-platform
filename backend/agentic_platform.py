"""Agentic Platform Orchestrator.

Coordinates all platform components.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from backend.llm_gateway import get_llm_gateway
from backend.guardrails_manager import get_guardrails_manager
from backend.websocket_server import get_websocket_server
from backend.visualization_generator import VisualizationGenerator
from backend.explanation_agent import TextExplanationAgent, AudioExplanationAgent



class AgenticPlatform:
    """
    Main platform orchestrator.
    
    Coordinates:
    - LLM Gateway
    - Guardrails Manager
    - WebSocket Server
    - Conversations and state management
    """

    def __init__(self):
        """Initialize platform."""
        self.gateway = get_llm_gateway()
        self.guardrails = get_guardrails_manager()
        self.ws_server = None  # Initialized separately with Flask app
        self.conversations = {}
        self.stats = {
            'total_conversations': 0,
            'active_conversations': 0
        }
        
        # Initialize Explanation Agents
        self.text_explanation_agent = TextExplanationAgent(self.gateway)
        self.audio_explanation_agent = AudioExplanationAgent(self.gateway)
    
    def set_websocket_server(self, ws_server):
        """Set WebSocket server instance."""
        self.ws_server = ws_server
    
    def create_conversation(
        self,
        source_code: str,
        source_lang: str,
        target_lang: str
    ) -> str:
        """
        Create a new conversation.
        
        Args:
            source_code: Source code to translate
            source_lang: Source language
            target_lang: Target language
            
        Returns:
            conversation_id: Unique conversation ID
        """
        conversation_id = str(uuid.uuid4())
        
        self.conversations[conversation_id] = {
            'id': conversation_id,
            'source_code': source_code,
            'source_language': source_lang,
            'target_language': target_lang,
            'status': 'created',
            'created_at': datetime.now().isoformat(),
            'events': []
        }
        
        self.stats['total_conversations'] += 1
        self.stats['active_conversations'] += 1
        
        return conversation_id
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        """Get conversation by ID."""
        return self.conversations.get(conversation_id)
    
    def list_conversations(self, limit: int = 50) -> list:
        """List recent conversations."""
        conversations = list(self.conversations.values())
        return sorted(conversations, key=lambda x: x['created_at'], reverse=True)[:limit]
    
    def cancel_conversation(self, conversation_id: str):
        """Cancel a conversation."""
        if conversation_id in self.conversations:
            self.conversations[conversation_id]['status'] = 'cancelled'
            self.stats['active_conversations'] -= 1
    
    def translate_code(
        self,
        conversation_id: str,
        enable_streaming: bool = True
    ) -> Dict[str, Any]:
        """
        Execute code translation.
        
        Args:
            conversation_id: Conversation ID
            enable_streaming: Enable real-time updates
            
        Returns:
            Translation result
        """
        conversation = self.get_conversation(conversation_id)
        if not conversation:
            return {'success': False, 'error': 'Conversation not found'}
        
        # Validate input
        is_valid, violations = self.guardrails.validate_input(conversation['source_code'])
        if not is_valid:
            return {
                'success': False,
                'error': 'Input validation failed',
                'violations': [{'validator': v.validator_name, 'message': v.message} for v in violations]
            }
        
        # Mock translation (in production, use AG2 agents)
        translated_code = f"// Translated from {conversation['source_language']} to {conversation['target_language']}\n{conversation['source_code']}"
        
        # Update conversation
        conversation['status'] = 'completed'
        conversation['translated_code'] = translated_code
        self.stats['active_conversations'] -= 1
        
        return {
            'success': True,
            'translated_code': translated_code,
            'conversation_id': conversation_id,
            'metrics': {
                'tokens': 100,
                'duration_ms': 1000
            }
        }
    
    def get_platform_stats(self) -> Dict[str, Any]:
        """Get comprehensive platform statistics."""
        return {
            'platform': {
                'total_conversations': self.stats['total_conversations'],
                'active_conversations': self.stats['active_conversations']
            },
            'gateway': self.gateway.get_stats(),
            'guardrails': self.guardrails.get_stats(),
            'websocket': self.ws_server.get_stats() if self.ws_server else {}
        }


# Singleton instance
_platform_instance = None

def get_platform() -> AgenticPlatform:
    """Get or create Platform singleton."""
    global _platform_instance
    if _platform_instance is None:
        _platform_instance = AgenticPlatform()
        print("✅ Agentic Platform initialized")
    return _platform_instance
