
import os
import sys
from flask import Flask
from backend.payment import get_razorpay_client, payment_bp

# Mock environment variables for testing if not set
if not os.getenv("RAZORPAY_KEY_ID"):
    print("Setting mock keys for testing...")
    os.environ["RAZORPAY_KEY_ID"] = "rzp_test_mock"
    os.environ["RAZORPAY_KEY_SECRET"] = "secret_mock"

try:
    print("Attempting to get client...")
    client = get_razorpay_client()
    print(f"Client created: {client}")
    
    if client:
        print("Attempting to create order...")
        # Mock order creation
        # We expect this to MAYBE fail if it hits the network with bad keys, 
        # but we are checking for RecursionError specifically.
        try:
            client.order.create(data={
                "amount": 100,
                "currency": "INR",
                "receipt": "test_receipt"
            })
        except Exception as e:
            print(f"Order creation error: {type(e).__name__}: {e}")

except Exception as e:
    print(f"Top level error: {type(e).__name__}: {e}")
