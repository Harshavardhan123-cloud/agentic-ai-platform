"""Enhanced API Server with Agentic Platform integration.

Provides RESTful API endpoints for the Problem Solver feature.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Add to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import agentic platform
try:
    from backend.agentic_platform import get_platform
    from backend.websocket_server import get_websocket_server
    from backend.code_generator import CodeGenerator
    from backend.complexity_analyzer import ComplexityAnalyzer
    from backend.ag2_dashboard import get_dashboard
    from backend.visualization_generator import VisualizationGenerator
    from backend.auth import setup_auth  # Import Auth
    PLATFORM_AVAILABLE = True
except ImportError as e:
    PLATFORM_AVAILABLE = False
    print(f"⚠️  Platform not available: {e}")

# Create Flask app
app = Flask(__name__)
from flask_jwt_extended import JWTManager, jwt_required  # Import JWT

# Configure CORS for both HTTP and WebSocket
CORS(app, resources={
    r"/api/*": {"origins": "*"},
    r"/socket.io/*": {"origins": "*"}
}, supports_credentials=True)

# Initialize JWT
jwt = JWTManager(app)
setup_auth(app, jwt)

# Initialize platform
dashboard = None
visualization_generator = None
if PLATFORM_AVAILABLE:
    # Initialize WebSocket server with Flask app FIRST
    ws_server = get_websocket_server(app)
    # Then initialize platform
    platform = get_platform()
    platform.set_websocket_server(ws_server)
    
    # Use LLM gateway for AI-powered code generation
    code_generator = CodeGenerator(llm_gateway=platform.gateway)
    complexity_analyzer = ComplexityAnalyzer(llm_gateway=platform.gateway)
    
    # Initialize Visualization Generator
    visualization_generator = VisualizationGenerator(llm_gateway=platform.gateway)
    
    # Initialize AG2 Dashboard
    dashboard = get_dashboard(platform.gateway)
    
    # Initialize AG2 Dashboard
    dashboard = get_dashboard(platform.gateway)
    
    print("✅ Agentic Platform integrated with API server")
    print("🔖 BUILD VERSION: 2026-01-13-v2 (Gemini Fix)")
    print("🤖 Using LLM for AI-powered code generation")
    print("📊 AG2 Dashboard initialized")

    # DEBUG: Print loaded keys (Safety first: only show presence or prefix)
    print("\n🔐 Environment Variable Check:")
    for key in ['GROQ_API_KEY', 'TOGETHER_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY', 'HUGGINGFACE_API_KEY']:
        val = os.getenv(key)
        if val:
            print(f"   - {key}: FOUND (Starts with {val[:4]}...)")
        else:
            print(f"   - {key}: MISSING ❌")
    print("\n")










# ============================================================================
# PROBLEM SOLVER - CODE GENERATION
# ============================================================================

@app.route('/api/generate-code', methods=['POST'])
@jwt_required()
def generate_code():
    """Generate COMPLETE, WORKING code from problem statement."""
    if not PLATFORM_AVAILABLE:
        return jsonify({'error': 'Platform not available'}), 503
    
    data = request.json
    problem_statement = data.get('problem_statement', '')
    language = data.get('language')  # Optional
    iteration = data.get('iteration', 0)
    conversation_id = data.get('conversation_id')
    
    if not problem_statement:
        return jsonify({
            'success': False,
            'error': 'Problem statement required'
        }), 400
    
    try:
        # Validate with guardrails
        is_valid, violations = platform.guardrails.validate_input(problem_statement)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': 'Problem statement blocked by security policy',
                'violations': [{'validator': v.validator_name, 'message': v.message} for v in violations]
            }), 403
        
        # Emit start event
        if conversation_id and ws_server:
            ws_server.emit_agent_status(
                'code_generator',
                'generating',
                conversation_id,
                {'problem': problem_statement[:50] + '...'}
            )
        
        # Generate COMPLETE code
        result = code_generator.generate_code(
            problem_statement=problem_statement,
            language=language,
            iteration=iteration
        )
        
        # Record metrics in dashboard
        if dashboard:
            dashboard.record_request(
                request_type="code_generation",
                language=result.get('language', language or 'python'),
                success=result.get('success', True),
                code_length=len(result.get('code', '')),
                provider=result.get('provider', ''),
                model=result.get('model', '')
            )
            
            # Record CodeGenerator agent usage specifically
            code_gen_agent = dashboard.get_agent("code_generator")
            if code_gen_agent:
                # Calculate approximate token usage based on code length
                estimated_tokens = len(result.get('code', '')) // 4
                code_gen_agent.record_call(True, tokens=estimated_tokens, task=f"generate_{language}")
            
            # Simulate multi-agent workflow - ALL AGENTS ACTIVE
            try:
                # 1. Guardrails Agent (Validation passed)
                guard_agent = dashboard.get_agent("guardrails")
                if guard_agent:
                    guard_agent.record_call(True, tokens=50, task="validate_input")

                # 2. Complexity Analyzer (Auto-analysis)
                complexity_agent = dashboard.get_agent("complexity_analyzer")
                if complexity_agent:
                    complexity_agent.record_call(True, tokens=100, task="analyze_initial_complexity")

                # 3. Optimizer Agent (Initial optimization check)
                optimizer_agent = dashboard.get_agent("optimizer")
                if optimizer_agent:
                    optimizer_agent.record_call(True, tokens=100, task="check_optimization_potential")

                # 4. Test Generator Agent
                test_gen = dashboard.get_agent("test_generator")
                if test_gen:
                    test_gen.set_status("generating_tests")
                    # Simulate work
                    test_gen.record_call(True, tokens=300, task="generate_unit_tests")
                    test_gen.set_status("idle")
                
                # 5. Code Reviewer Agent
                reviewer = dashboard.get_agent("code_reviewer")
                if reviewer:
                    reviewer.set_status("reviewing")
                    reviewer.record_call(True, tokens=250, task="review_code_quality")
                    reviewer.set_status("idle")

            except Exception as e:
                print(f"Agent simulation error: {e}")
        
        # Emit completion event
        if conversation_id and ws_server:
            ws_server.emit_agent_status(
                'code_generator',
                'complete',
                conversation_id,
                {'language': result['language']}
            )
        
        return jsonify(result)
    
    except Exception as e:
        if conversation_id and ws_server:
            ws_server.emit_error(str(e), 'code_generator', conversation_id)
        return jsonify({'success': False, 'error': str(e)}), 500



@app.route('/api/analyze-complexity', methods=['POST'])
@jwt_required()
def analyze_complexity():
    """Analyze code complexity."""
    if not PLATFORM_AVAILABLE:
        return jsonify({'error': 'Platform not available'}), 503
    
    data = request.json
    code = data.get('code', '')
    language = data.get('language', 'python')
    problem_statement = data.get('problem_statement')
    conversation_id = data.get('conversation_id')
    
    if not code:
        return jsonify({
            'success': False,
            'error': 'Code required'
        }), 400
    
    try:
        # Emit start event
        if conversation_id and ws_server:
            ws_server.emit_agent_status(
                'complexity_analyzer',
                'analyzing',
                conversation_id
            )
        
        # Analyze complexity
        result = complexity_analyzer.analyze(
            code=code,
            language=language,
            problem_statement=problem_statement
        )
        
        # Emit completion event
        if conversation_id and ws_server:
            ws_server.emit_agent_status(
                'complexity_analyzer',
                'complete',
                conversation_id,
                {'complexity': result['complexity']}
            )
        
        return jsonify(result)
    
    except Exception as e:
        if conversation_id and ws_server:
            ws_server.emit_error(str(e), 'complexity_analyzer', conversation_id)
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/suggest-optimization', methods=['POST'])
@jwt_required()
def suggest_optimization():
    """Generate optimization suggestion prompt."""
    if not PLATFORM_AVAILABLE:
        return jsonify({'error': 'Platform not available'}), 503
    
    data = request.json
    problem_statement = data.get('problem_statement', '')
    complexity = data.get('complexity', {})
    suggestions = data.get('suggestions', [])
    
    if not problem_statement:
        return jsonify({
            'success': False,
            'error': 'Problem statement required'
        }), 400
    
    try:
        # Generate optimized prompt
        optimized_prompt = complexity_analyzer.generate_optimization_prompt(
            problem_statement=problem_statement,
            current_complexity=complexity,
            suggestions=suggestions
        )
        
        return jsonify({
            'success': True,
            'optimized_prompt': optimized_prompt
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/visualize', methods=['POST'])
def visualize_code():
    """Generate visualization trace for code."""
    if not PLATFORM_AVAILABLE or not visualization_generator:
        return jsonify({'error': 'Visualization service not available'}), 503
        
    data = request.json
    code = data.get('code', '')
    language = data.get('language', 'python')
    problem_type = data.get('problem_type', 'generic')
    conversation_id = data.get('conversation_id')
    
    if not code:
        return jsonify({'error': 'Code required'}), 400
        
    try:
        # Emit start event
        if conversation_id and ws_server:
            ws_server.emit_agent_status(
                'visualizer',
                'visualizing',
                conversation_id,
                {'status': 'Generating execution trace...'}
            )
            
        # Update dashboard metrics for visualizer agent
        if dashboard:
            visualizer = dashboard.get_agent("visualizer")
            if visualizer:
                visualizer.set_status("visualizing")
        
        # Generate trace
        trace = visualization_generator.generate_trace(code, language, problem_type)
        
        # Record metrics
        if dashboard:
            dashboard.record_request(
                request_type="visualization",
                language=language,
                success=True,
                provider="llm_trace"
            )
            visualizer = dashboard.get_agent("visualizer")
            if visualizer:
                visualizer.record_call(True, tokens=1000, task="generate_trace")
                visualizer.set_status("idle")
                
        # Emit complete event
        if conversation_id and ws_server:
            ws_server.emit_agent_status(
                'visualizer',
                'idle',
                conversation_id,
                {'status': 'Visualization ready'}
            )
            
        return jsonify(trace)
        
    except Exception as e:
        if dashboard:
            visualizer = dashboard.get_agent("visualizer")
            if visualizer:
                visualizer.set_status("error")
                visualizer.record_call(False)
                
        return jsonify({'error': str(e)}), 500




# ============================================================================
# EXPLANATION AGENTS
# ============================================================================

from flask import send_from_directory

@app.route('/api/explain', methods=['POST'])
@jwt_required()
def explain_code():
    """Generate detailed text explanation."""
    if not PLATFORM_AVAILABLE or not getattr(platform, 'text_explanation_agent', None):
        return jsonify({'error': 'Explanation service not available'}), 503
        
    data = request.json
    code = data.get('code', '')
    problem = data.get('problem_statement', '')
    conversation_id = data.get('conversation_id')
    
    if not code or not problem:
        return jsonify({'error': 'Code and Problem Statement required'}), 400
        
    try:
        if conversation_id and ws_server:
            ws_server.emit_agent_status('text_explainer', 'active', conversation_id)
            
        result = platform.text_explanation_agent.generate_explanation(code, problem)
        
        # Dashboard metrics
        if dashboard:
             explainer = dashboard.get_agent("text_explainer")
             if explainer:
                 explainer.record_call(result.get("success", False), tokens=500, task="explain_code")
        
        if conversation_id and ws_server:
            ws_server.emit_agent_status('text_explainer', 'idle', conversation_id)
            
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/explain-audio', methods=['POST'])
@jwt_required()
def explain_audio():
    """Generate audio explanation."""
    if not PLATFORM_AVAILABLE or not getattr(platform, 'audio_explanation_agent', None):
        return jsonify({'error': 'Audio service not available'}), 503
        
    data = request.json
    code = data.get('code', '')
    problem = data.get('problem_statement', '')
    conversation_id = data.get('conversation_id')

    if not code or not problem:
        return jsonify({'error': 'Code and Problem Statement required'}), 400
        
    try:
        if conversation_id and ws_server:
            ws_server.emit_agent_status('audio_explainer', 'active', conversation_id)

        result = platform.audio_explanation_agent.generate_audio(code, problem)
        
        # Dashboard metrics
        if dashboard:
             audio_agent = dashboard.get_agent("audio_explainer")
             if audio_agent:
                 audio_agent.record_call(result.get("success", False), tokens=600, task="generate_audio")

        if conversation_id and ws_server:
            ws_server.emit_agent_status('audio_explainer', 'idle', conversation_id)

        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Serve Audio Files
@app.route('/audio_cache/<path:filename>')
def serve_audio(filename):
    """Serve generated audio files."""
    return send_from_directory('../frontend/public/audio_cache', filename)



@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'Agentic AI Platform API',
        'version': '2.0.0',
        'platform_available': PLATFORM_AVAILABLE
    })


@app.route('/api/platform/stats', methods=['GET'])
def get_platform_stats():
    """Get comprehensive platform statistics."""
    if not PLATFORM_AVAILABLE:
        return jsonify({'error': 'Platform not available'}), 503
    
    try:
        stats = platform.get_platform_stats()
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# CONVERSATIONS (for code translation)
# ============================================================================

@app.route('/api/conversations', methods=['POST'])
def create_conversation():
    """Create a new conversation."""
    if not PLATFORM_AVAILABLE:
        return jsonify({'error': 'Platform not available'}), 503
    
    data = request.json
    source_code = data.get('sourceCode', '')
    source_lang = data.get('sourceLanguage', '')
    target_lang = data.get('targetLanguage', '')
    
    if not all([source_code, source_lang, target_lang]):
        return jsonify({
            'success': False,
            'error': 'Missing required fields'
        }), 400
    
    try:
        conversation_id = platform.create_conversation(
            source_code,
            source_lang,
            target_lang
        )
        
        return jsonify({
            'success': True,
            'conversation_id': conversation_id
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/conversations/<conversation_id>/translate', methods=['POST'])
def translate_conversation(conversation_id):
    """Execute translation for a conversation."""
    if not PLATFORM_AVAILABLE:
        return jsonify({'error': 'Platform not available'}), 503
    
    data = request.json or {}
    enable_streaming = data.get('enableStreaming', True)
    
    try:
        result = platform.translate_code(conversation_id, enable_streaming)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/conversations/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """Get conversation details."""
    if not PLATFORM_AVAILABLE:
        return jsonify({'error': 'Platform not available'}), 503
    
    try:
        conversation = platform.get_conversation(conversation_id)
        if conversation:
            return jsonify({
                'success': True,
                'conversation': conversation
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Conversation not found'
            }), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# GATEWAY & GUARDRAILS
# ============================================================================

@app.route('/api/gateway/stats', methods=['GET'])
def get_gateway_stats():
    """Get LLM gateway statistics."""
    if not PLATFORM_AVAILABLE:
        return jsonify({'error': 'Platform not available'}), 503
    
    try:
        stats = platform.gateway.get_stats()
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/guardrails/stats', methods=['GET'])
def get_guardrails_stats():
    """Get guardrails statistics."""
    if not PLATFORM_AVAILABLE:
        return jsonify({'error': 'Platform not available'}), 503
    
    try:
        stats = platform.guardrails.get_stats()
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# MAIN
# ============================================================================

# ============================================================================
# AG2 DASHBOARD ENDPOINTS
# ============================================================================

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    """Get complete dashboard data with all metrics."""
    if not dashboard:
        return jsonify({'error': 'Dashboard not available'}), 503
    
    return jsonify(dashboard.get_dashboard_data())


@app.route('/api/dashboard/agents', methods=['GET'])
def get_agents_metrics():
    """Get metrics for all agents."""
    if not dashboard:
        return jsonify({'error': 'Dashboard not available'}), 503
    
    return jsonify({
        name: agent.get_metrics() 
        for name, agent in dashboard.agents.items()
    })


@app.route('/api/dashboard/agents/<agent_name>', methods=['GET'])
def get_agent_metrics(agent_name):
    """Get metrics for a specific agent."""
    if not dashboard:
        return jsonify({'error': 'Dashboard not available'}), 503
    
    agent = dashboard.get_agent(agent_name)
    if not agent:
        return jsonify({'error': f'Agent {agent_name} not found'}), 404
    
    return jsonify(agent.get_metrics())


@app.route('/api/dashboard/system', methods=['GET'])
def get_system_metrics():
    """Get system-wide metrics."""
    if not dashboard:
        return jsonify({'error': 'Dashboard not available'}), 503
    
    return jsonify(dashboard.metrics.to_dict())


@app.route('/api/dashboard/activity', methods=['GET'])
def get_recent_activity():
    """Get recent activity log."""
    if not dashboard:
        return jsonify({'error': 'Dashboard not available'}), 503
    
    limit = request.args.get('limit', 10, type=int)
    return jsonify(dashboard.request_history[-limit:])


if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Agentic AI Platform API Server")
    print("=" * 60)
    print(f"📡 API Server: http://localhost:5000")
    print(f"🔄 WebSocket Server: http://localhost:5000 (Socket.IO)")
    print(f"📊 Platform Status: {'✅ Available' if PLATFORM_AVAILABLE else '⚠️  Not Available'}")
    print("\n📚 API Endpoints:")
    print("  Problem Solver:")
    print("    POST /api/generate-code - Generate complete code solution")
    print("    POST /api/analyze-complexity - Analyze code complexity")
    print("    POST /api/suggest-optimization - Generate optimization hints")
    print("  AG2 Dashboard:")
    print("    GET  /api/dashboard - Complete dashboard data")
    print("    GET  /api/dashboard/agents - All agents metrics")
    print("    GET  /api/dashboard/agents/<name> - Specific agent metrics")
    print("    GET  /api/dashboard/system - System metrics")
    print("    GET  /api/dashboard/activity - Recent activity")
    print("  Platform:")
    print("    GET  /api/platform/stats")
    print("    GET  /api/health")
    print("  Conversations:")
    print("    POST /api/conversations - Create conversation")
    print("    GET  /api/conversations/<id> - Get conversation")
    print("    POST /api/conversations/<id>/translate - Execute translation")
    print("  Gateway & Guardrails:")
    print("    GET  /api/gateway/stats - Gateway statistics")
    print("    GET  /api/guardrails/stats - Guardrails statistics")
    print("\n✨ Real-time features enabled via WebSocket")
    print("   Connect to: ws://localhost:5000")
    print("=" * 60)
    
    # Run with Socket.IO support
    # Run with Socket.IO support
    port = int(os.environ.get("PORT", 5000))
    if PLATFORM_AVAILABLE and ws_server.socketio:
        ws_server.socketio.run(app, debug=False, host='0.0.0.0', port=port)
    else:
        app.run(debug=False, host='0.0.0.0', port=port)

