#!/usr/bin/env python3
"""
Simple test to verify code generation works with full implementations.
Run this to test the code generator directly.
"""

import sys
sys.path.insert(0, '.')

from backend.code_generator import CodeGenerator

# Create generator (no LLM gateway = uses built-in complete solutions)
generator = CodeGenerator(llm_gateway=None)

print("=" * 70)
print("🧪 TESTING ENHANCED CODE GENERATOR - FULL IMPLEMENTATIONS")
print("=" * 70)

# Test problems
test_problems = [
    ("Write a function to reverse a string", "python"),
    ("Write a function to calculate factorial", "python"),
    ("Write a function to check if a number is prime", "python"),
]

for problem, lang in test_problems:
    print(f"\n\n{'='*70}")
    print(f"Problem: {problem}")
    print(f"Language: {lang}")
    print("=" * 70)
    
    result = generator.generate_code(problem, lang, iteration=0)
    
    if result['success']:
        code_len = len(result['code'])
        print(f"✅ SUCCESS - Generated {code_len} characters")
        print(f"Provider: {result['provider']}")
        print(f"\n--- GENERATED CODE ---")
        print(result['code'])
        print("\n" + "=" * 70)
    else:
        print("❌ FAILED")

print("\n\n" + "=" * 70)
print("✅ TEST COMPLETE - Check the output above")
print("=" * 70)
