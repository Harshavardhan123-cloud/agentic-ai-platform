"""
Razorpay Payment Integration Module
Handles order creation, payment verification, and subscription management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import razorpay
import os
import hmac
import hashlib

# Create Blueprint
payment_bp = Blueprint('payment', __name__)

# Razorpay client (initialized with env variables)
def get_razorpay_client():
    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret:
        return None
    return razorpay.Client(auth=(key_id, key_secret))

# Subscription Plans with pricing (in paise - 1 INR = 100 paise)
PLANS = {
    "free": {"name": "Free", "price": 0, "features": ["10 generations/day", "5 languages"]},
    "pro": {"name": "Pro", "price": 49900, "features": ["Unlimited generations", "21 languages", "Chrome Extension"]},
    "enterprise": {"name": "Enterprise", "price": 199900, "features": ["All Pro features", "Priority Support", "API Access"]}
}

@payment_bp.route('/plans', methods=['GET'])
def get_plans():
    """Get available subscription plans."""
    return jsonify({"plans": PLANS})

@payment_bp.route('/create-order', methods=['POST'])
@jwt_required()
def create_order():
    """Create a Razorpay order for subscription."""
    try:
        client = get_razorpay_client()
        if not client:
            return jsonify({"error": "Payment gateway not configured"}), 503
        
        data = request.json
        plan_id = data.get("plan", "pro")
        
        if plan_id not in PLANS or PLANS[plan_id]["price"] == 0:
            return jsonify({"error": "Invalid plan selected"}), 400
        
        plan = PLANS[plan_id]
        
        # Create Razorpay order
        order_data = {
            "amount": plan["price"],  # Amount in paise
            "currency": "INR",
            "receipt": f"order_{get_jwt_identity()}_{plan_id}",
            "notes": {
                "plan": plan_id,
                "username": get_jwt_identity()
            }
        }
        
        order = client.order.create(data=order_data)
        
        return jsonify({
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": os.getenv("RAZORPAY_KEY_ID"),
            "plan": plan
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@payment_bp.route('/verify', methods=['POST'])
@jwt_required()
def verify_payment():
    """Verify Razorpay payment signature and activate subscription."""
    try:
        client = get_razorpay_client()
        if not client:
            return jsonify({"error": "Payment gateway not configured"}), 503
        
        data = request.json
        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_payment_id = data.get("razorpay_payment_id")
        razorpay_signature = data.get("razorpay_signature")
        plan = data.get("plan", "pro")
        
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return jsonify({"error": "Missing payment details"}), 400
        
        # Verify signature
        key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
        message = f"{razorpay_order_id}|{razorpay_payment_id}"
        generated_signature = hmac.new(
            key_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != razorpay_signature:
            return jsonify({"error": "Invalid payment signature"}), 400
        
        # Update user subscription in database
        from backend.database import update_user_subscription, add_payment_record
        username = get_jwt_identity()
        
        # Record payment
        add_payment_record(
            username=username,
            order_id=razorpay_order_id,
            payment_id=razorpay_payment_id,
            amount=PLANS[plan]["price"],
            plan=plan,
            status="success"
        )
        
        # Activate subscription
        update_user_subscription(username, plan, "active")
        
        return jsonify({
            "success": True,
            "message": f"Payment successful! {PLANS[plan]['name']} plan activated.",
            "plan": plan
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@payment_bp.route('/status', methods=['GET'])
@jwt_required()
def get_subscription_status():
    """Get current user's subscription status."""
    try:
        from backend.database import get_user_subscription
        username = get_jwt_identity()
        subscription = get_user_subscription(username)
        return jsonify(subscription)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payment_bp.route('/create-guest-order', methods=['POST'])
def create_guest_order():
    """Create a Razorpay order for guest (pre-registration) checkout."""
    try:
        client = get_razorpay_client()
        if not client:
            return jsonify({"error": "Payment gateway not configured"}), 503
        
        data = request.json
        plan_id = data.get("plan", "pro")
        email = data.get("email", "guest")
        
        if plan_id not in PLANS or PLANS[plan_id]["price"] == 0:
            return jsonify({"error": "Invalid plan selected"}), 400
        
        plan = PLANS[plan_id]
        
        # Create Razorpay order for guest
        import time
        order_data = {
            "amount": plan["price"],  # Amount in paise
            "currency": "INR",
            "receipt": f"guest_{email}_{plan_id}_{int(time.time())}",
            "notes": {
                "plan": plan_id,
                "email": email,
                "type": "registration"
            }
        }
        
        order = client.order.create(data=order_data)
        
        return jsonify({
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": os.getenv("RAZORPAY_KEY_ID"),
            "plan": plan
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@payment_bp.route('/register-with-payment', methods=['POST'])
def register_with_payment():
    """Verify payment and register user in one step."""
    try:
        data = request.json
        
        # Payment verification data
        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_payment_id = data.get("razorpay_payment_id")
        razorpay_signature = data.get("razorpay_signature")
        plan = data.get("plan", "pro")
        
        # User registration data
        user_data = data.get("user_data", {})
        email = user_data.get("email")
        password = user_data.get("password")
        name = user_data.get("name")
        phone = user_data.get("phone")
        country = user_data.get("country")
        
        # Validate required fields
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return jsonify({"error": "Missing payment details"}), 400
        
        if not all([email, password, name, phone, country]):
            return jsonify({"error": "Missing user registration details"}), 400
        
        # Verify Razorpay signature
        key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
        message = f"{razorpay_order_id}|{razorpay_payment_id}"
        generated_signature = hmac.new(
            key_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != razorpay_signature:
            return jsonify({"error": "Invalid payment signature"}), 400
        
        # Payment verified - now register the user
        from backend.database import add_user, add_payment_record
        
        result = add_user(email, password, name, phone, country, plan, "active")
        
        if not result.get("success"):
            return jsonify({"error": result.get("error", "Registration failed")}), 409
        
        # Record payment
        add_payment_record(
            username=email,
            order_id=razorpay_order_id,
            payment_id=razorpay_payment_id,
            amount=PLANS[plan]["price"],
            plan=plan,
            status="success"
        )
        
        return jsonify({
            "success": True,
            "message": f"Payment successful! Account created with {PLANS[plan]['name']} plan.",
            "plan": plan
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def setup_payment(app):
    """Register payment blueprint with the app."""
    app.register_blueprint(payment_bp, url_prefix='/api/payment')
