"""
Razorpay Payment Integration Module
Handles order creation, payment verification, and subscription management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import hmac
import hashlib
import time
import requests
import base64

# Create Blueprint
payment_bp = Blueprint('payment', __name__)

# Helper to make Razorpay requests
def create_razorpay_order(amount, currency, receipt, notes):
    """Create order via direct HTTP request to avoid SDK recursion issues."""
    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    
    if not key_id or not key_secret:
        return None, "Payment gateway configuration missing"

    url = "https://api.razorpay.com/v1/orders"
    auth = (key_id, key_secret)
    data = {
        "amount": amount,
        "currency": currency,
        "receipt": receipt,
        "notes": notes
    }
    
    try:
        response = requests.post(url, json=data, auth=auth, timeout=10)
        if response.status_code == 200:
            return response.json(), None
        else:
            return None, f"Razorpay Error: {response.text}"
    except Exception as e:
        return None, f"Connection Error: {str(e)}"

# Helper to verify signature
def verify_signature(order_id, payment_id, signature):
    """Verify Razorpay signature locally."""
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    if not key_secret:
        return False
        
    message = f"{order_id}|{payment_id}"
    generated_signature = hmac.new(
        key_secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return generated_signature == signature

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
        data = request.json
        plan_id = data.get("plan", "pro")
        
        if plan_id not in PLANS or PLANS[plan_id]["price"] == 0:
            return jsonify({"error": "Invalid plan selected"}), 400
        
        plan = PLANS[plan_id]
        
        # Create Razorpay order
        order_data, error = create_razorpay_order(
            amount=plan["price"],
            currency="INR",
            receipt=f"order_{get_jwt_identity()}_{plan_id}",
            notes={
                "plan": plan_id,
                "username": get_jwt_identity()
            }
        )
        
        if error:
            return jsonify({"error": error}), 503 if "configuration missing" in error else 500
            
        return jsonify({
            "order_id": order_data["id"],
            "amount": order_data["amount"],
            "currency": order_data["currency"],
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
        data = request.json
        razorpay_order_id = data.get("razorpay_order_id")
        razorpay_payment_id = data.get("razorpay_payment_id")
        razorpay_signature = data.get("razorpay_signature")
        plan = data.get("plan", "pro")
        
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return jsonify({"error": "Missing payment details"}), 400
        
        # Verify signature
        if not verify_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
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
        data = request.json
        plan_id = data.get("plan", "pro")
        email = data.get("email", "guest")
        
        if plan_id not in PLANS or PLANS[plan_id]["price"] == 0:
            return jsonify({"error": "Invalid plan selected"}), 400
        
        plan = PLANS[plan_id]
        
        # Create Razorpay order via direct HTTP
        order_data, error = create_razorpay_order(
            amount=plan["price"],
            currency="INR",
            receipt=f"guest_{email}_{plan_id}_{int(time.time())}",
            notes={
                "plan": plan_id,
                "email": email,
                "type": "registration"
            }
        )
        
        if error:
            print(f"Guest order creation error: {error}")
            return jsonify({"error": error}), 503 if "configuration missing" in error else 500
        
        return jsonify({
            "order_id": order_data["id"],
            "amount": order_data["amount"],
            "currency": order_data["currency"],
            "key_id": os.getenv("RAZORPAY_KEY_ID"),
            "plan": plan
        })
        
    except Exception as e:
        print(f"Guest order exception: {e}")
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
        if not verify_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
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
