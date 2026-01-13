from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from datetime import timedelta
from backend.database import verify_user, add_user

# Create Blueprint
auth_bp = Blueprint('auth', __name__)

def setup_auth(app, jwt):
    """Configure JWT settings."""
    app.config["JWT_SECRET_KEY"] = "super-secret-agentic-key-change-in-prod"
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)
    
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
    """Authenticate user and return tokens."""
    username = request.json.get("username", None)
    password = request.json.get("password", None)
    
    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400

    # DEMO BYPASS: Allow admin/admin always
    if username.strip() == "admin" and password.strip() == "admin":
        access_token = create_access_token(identity="admin")
        refresh_token = create_refresh_token(identity="admin")
        return jsonify({
            "access_token": access_token, 
            "refresh_token": refresh_token,
            "user": {"username": "admin", "role": "admin"}
        })
        
    if not verify_user(username, password):
        return jsonify({"msg": "Bad username or password"}), 401
    
    access_token = create_access_token(identity=username)
    refresh_token = create_refresh_token(identity=username)
    
    return jsonify({
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "user": {"username": username, "role": "user"}
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
