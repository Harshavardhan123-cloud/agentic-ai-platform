"""Authentication module for Agentic AI Platform.

Handles JWT token issuance, refresh, and protection.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from datetime import timedelta

# Create Blueprint
auth_bp = Blueprint('auth', __name__)

# Mock User Store (Replace with DB in production)
USERS = {
    "admin": "AgenticAI2026!"
}

def setup_auth(app, jwt):
    """Configure JWT settings."""
    app.config["JWT_SECRET_KEY"] = "super-secret-agentic-key-change-in-prod"
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)
    
    # Register Blueprint
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return tokens."""
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    
    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400
        
    if username not in USERS or USERS[username] != password:
        return jsonify({"msg": "Bad username or password"}), 401
    
    access_token = create_access_token(identity=username)
    refresh_token = create_refresh_token(identity=username)
    
    return jsonify({
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "user": {"username": username, "role": "admin"}
    })

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token."""
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify(access_token=access_token)

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    """Test protected endpoint."""
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200
