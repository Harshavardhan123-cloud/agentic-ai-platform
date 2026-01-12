"""WebSocket Server for real-time communication.

Provides real-time updates via Socket.IO.
"""

from typing import Any, Dict
import uuid


class WebSocketServer:
    """
    WebSocket server for real-time agent communication.
    
    Features:
    - Socket.IO integration with Flask
    - Room-based messaging
    - Event broadcasting
    """
    
    def __init__(self, app=None):
        """
        Initialize WebSocket server.
        
        Args:
            app: Flask app instance
        """
        self.app = app
        self.socketio = None
        self.connections = {}
        
        if app:
            self._init_socketio(app)
    
    def _init_socketio(self, app):
        """Initialize Socket.IO with Flask app."""
        try:
            from flask_socketio import SocketIO, emit, join_room
            
            self.socketio = SocketIO(app, cors_allowed_origins="*")
            
            # Register event handlers
            @self.socketio.on('connect')
            def handle_connect():
                connection_id = str(uuid.uuid4())
                # Store connection (would use session in production)
                print(f"Client connected: {connection_id}")
            
            @self.socketio.on('disconnect')
            def handle_disconnect():
                print("Client disconnected")
            
            @self.socketio.on('join_conversation')
            def handle_join_conversation(data):
                conversation_id = data.get('conversation_id')
                if conversation_id:
                    join_room(conversation_id)
                    print(f"Client joined conversation: {conversation_id}")
            
            print("✅ WebSocket server initialized")
            
        except ImportError:
            print("⚠️  flask-socketio not available. WebSocket disabled.")
    
    def emit_agent_status(
        self,
        agent_name: str,
        status: str,
        conversation_id: str,
        data: Dict[str, Any] = None
    ):
        """
        Emit agent status update.
        
        Args:
            agent_name: Name of the agent
            status: Status message
            conversation_id: Conversation ID
            data: Additional data
        """
        if not self.socketio:
            return
        
        event = {
            'agent_name': agent_name,
            'event_type': 'status_change',
            'status': status,
            'data': data or {}
        }
        
        self.socketio.emit('agent_event', event, room=conversation_id)
    
    def emit_agent_message(
        self,
        agent_name: str,
        message: str,
        conversation_id: str
    ):
        """Emit agent message."""
        if not self.socketio:
            return
        
        event = {
            'agent_name': agent_name,
            'event_type': 'message',
            'message': message
        }
        
        self.socketio.emit('agent_event', event, room=conversation_id)
    
    def emit_error(
        self,
        error: str,
        agent_name: str = None,
        conversation_id: str = None
    ):
        """Emit error event."""
        if not self.socketio:
            return
        
        event = {
            'agent_name': agent_name or 'system',
            'event_type': 'error',
            'error': error
        }
        
        if conversation_id:
            self.socketio.emit('agent_event', event, room=conversation_id)
        else:
            self.socketio.emit('agent_event', event)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get WebSocket statistics."""
        return {
            'active_connections': len(self.connections),
            'socket_io_enabled': self.socketio is not None
        }


# Singleton instance
_websocket_instance = None

def get_websocket_server(app=None) -> WebSocketServer:
    """Get or create WebSocket Server singleton."""
    global _websocket_instance
    if _websocket_instance is None:
        _websocket_instance = WebSocketServer(app)
    return _websocket_instance
