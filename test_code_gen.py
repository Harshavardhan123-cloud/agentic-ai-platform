"""Test the enhanced code generator"""
import sys
sys.path.insert(0, '/home/admin1/Desktop/Code_Agent/code-translator-agent')

from backend.code_generator import CodeGenerator

# Create generator
generator = CodeGenerator()

# Test problems
test_problems = [
    ("Write a function to reverse a string", "python"),
    ("Write a function to calculate the factorial of a number", "python"),
    ("Write a function to check if a number is prime", "python"),
    ("Write a function to calculate fibonacci numbers", "python"),
]

print("=" * 70)
print("TESTING ENHANCED CODE GENERATOR")
print("=" * 70)

for problem, lang in test_problems:
    print(f"\n\nProblem: {problem}")
    print(f"Language: {lang}")
    print("-" * 70)
    
    result = generator.generate_code(problem, lang)
    
    if result['success']:
        print("✅ SUCCESS")
        print(f"Generated {len(result['code'])} characters of code")
        print("\nCode Preview (first 500 chars):")
        print(result['code'][:500])
        print("...")
    else:
        print("❌ FAILED")

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)
