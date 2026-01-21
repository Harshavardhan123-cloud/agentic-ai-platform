from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies
)
from datetime import timedelta
from backend.database import verify_user, add_user
import os

# Create Blueprint
auth_bp = Blueprint('auth', __name__)

def setup_auth(app, jwt):
    """Configure JWT settings with HTTP-only cookies."""
    # Secret key - use environment variable in production
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-agentic-key-change-in-prod")
    
    # Token expiration
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)
    
    # Cookie configuration for session-based JWT
    app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]  # Support both cookies and headers
    app.config["JWT_COOKIE_SECURE"] = os.getenv("FLASK_ENV") == "production"  # True in production (HTTPS only)
    app.config["JWT_COOKIE_SAMESITE"] = "Lax"  # Prevents CSRF from other domains
    app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token_cookie"
    app.config["JWT_REFRESH_COOKIE_NAME"] = "refresh_token_cookie"
    app.config["JWT_COOKIE_CSRF_PROTECT"] = True  # CSRF protection enabled
    app.config["JWT_CSRF_IN_COOKIES"] = True  # Send CSRF token in cookies
    
    # Register Blueprint
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.json
    username = data.get("username", None)
    password = data.get("password", None)
    name = data.get("name", None)
    phone = data.get("phone", None)
    country = data.get("country", None)
    
    missing = []
    if not username: missing.append("username")
    if not password: missing.append("password")
    if not name: missing.append("name")
    if not phone: missing.append("phone")
    if not country: missing.append("country")
    
    if missing:
        return jsonify({"msg": f"Missing required fields: {', '.join(missing)}"}), 400
        
    if add_user(username, password, name, phone, country):
        return jsonify({"msg": "User created successfully"}), 201
    else:
        return jsonify({"msg": "Username already exists"}), 409

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return tokens in HTTP-only cookies."""
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    
    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400

    # DEBUG LOGS
    print(f"Login Attempt: '{username}' / '{password}'")
    
    # DEMO BYPASS: Allow admin/admin always
    if username and username.strip() == "admin" and password and password.strip() == "admin":
        print("✅ Demo Admin Bypass Triggered")
        access_token = create_access_token(identity="admin")
        refresh_token = create_refresh_token(identity="admin")
        
        # Create response with cookies
        response = jsonify({
            "msg": "Login successful",
            "access_token": access_token,  # Also include in body for backward compatibility
            "refresh_token": refresh_token,
            "user": {"username": "admin", "role": "admin"}
        })
        
        # Set HTTP-only cookies
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)
        
        return response
        
    if not verify_user(username, password):
        print("❌ Verify User Failed")
        return jsonify({"msg": "Login Failed (Invalid Credentials)"}), 401
    
    access_token = create_access_token(identity=username)
    refresh_token = create_refresh_token(identity=username)
    
    # Create response with cookies
    response = jsonify({
        "msg": "Login successful",
        "access_token": access_token,  # Also include in body for backward compatibility
        "refresh_token": refresh_token,
        "user": {"username": username, "role": "user"}
    })
    
    # Set HTTP-only cookies
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    
    return response

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token from cookie."""
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    
    response = jsonify({"msg": "Token refreshed", "access_token": access_token})
    set_access_cookies(response, access_token)
    
    return response

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout user by clearing JWT cookies."""
    response = jsonify({"msg": "Logout successful"})
    unset_jwt_cookies(response)
    print("🔓 User logged out, cookies cleared")
    return response

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info from session."""
    current_user = get_jwt_identity()
    return jsonify({
        "username": current_user,
        "role": "admin" if current_user == "admin" else "user"
    }), 200

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    """Test protected endpoint."""
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200

