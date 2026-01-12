# 🤖 Agentic AI Platform - Problem Solver

## ✨ Complete, Working Code Generation

This platform generates **COMPLETE, DETAILED, WORKING CODE** solutions from natural language problem statements - not just skeleton templates!

---

## 🚀 Quick Start

### Backend Only (Problem Solver API)

```bash
# Install dependencies
pip install -r requirements.txt

# Start backend
python3 backend/agentic_api_server.py
```

Backend will run on `http://localhost:5000`

---

## 📖 Features

### 🎯 Problem Solver - Code Generation

The enhanced code generator provides:

✅ **Full Working Implementations** - Complete code, not skeletons  
✅ **Detailed Documentation** - Comprehensive comments explaining logic  
✅ **Edge Case Handling** - Production-quality code  
✅ **Multiple Variants** - Basic + Optimized versions  
✅ **Complexity Analysis** - Time/Space complexity for each solution  
✅ **Example Usage** - Working examples included  

**Supported Problem Types:**
- String operations (reverse, palindrome)
- Mathematical (factorial, fibonacci, prime numbers)
- Searching & Sorting algorithms
- Data structure operations
- And generic problem solving

**Supported Languages:**
Python, JavaScript, Java, C++, C, Go, Rust, TypeScript, Ruby, PHP, Swift, Kotlin, C#

---

## 🔧 API Endpoints

### Generate Complete Code
```bash
POST /api/generate-code
{
  "problem_statement": "Write a function to check if a number is prime",
  "language": "python",  # optional, auto-detected
  "iteration": 0
}
```

**Response:**
```json
{
  "success": true,
  "code": "def is_prime(n):\n    \"\"\"Complete implementation with all logic\"\"\"\n    ...",
  "language": "python",
  "provider": "built-in",
  "timestamp": "2026-01-12T18:00:00"
}
```

### Analyze Complexity
```bash
POST /api/analyze-complexity
{
  "code": "generated code here",
  "language": "python",
  "problem_statement": "original problem"
}
```

**Response:**
```json
{
  "success": true,
  "complexity": {
    "time": "O(√n)",
    "space": "O(1)"
  },
  "can_optimize": true,
  "optimization_suggestions": [
    "Current complexity is O(√n). Can be optimized to O(log n).",
    "Consider using Sieve of Eratosthenes for multiple primes"
  ]
}
```

### Suggest Optimization
```bash
POST /api/suggest-optimization
{
  "problem_statement": "original problem",
  "complexity": {"time": "O(n²)", "space": "O(1)"},
  "suggestions": ["Use hash table"]
}
```

---

## 💡 Example Usage

### Test Code Generation

```bash
# Test reverse string problem
curl -X POST http://localhost:5000/api/generate-code \
  -H "Content-Type: application/json" \
  -d '{
    "problem_statement": "Write a function to reverse a string",
    "language": "python"
  }'
```

**Result:** Complete implementation with:
- Main reverse function with slicing  
- Manual two-pointer implementation
- Detailed docstrings
- Time/Space complexity comments
- Example usage with test cases
- ~1000+ characters of complete code

### Test Factorial Problem

```bash
curl -X POST http://localhost:5000/api/generate-code \
  -H "Content-Type: application/json" \
  -d '{
    "problem_statement": "Write a function to calculate factorial",
    "language": "python",
    "iteration": 0
  }'
```

**Result:** Two complete implementations:
- Recursive with memoization support
- Iterative O(n) version
- Error handling for negative numbers
- Comprehensive documentation
- Working examples

---

## 🏗️ Architecture

```
code-translator-agent/
├── backend/
│   ├── code_generator.py          # Enhanced with 9 full problem implementations
│   ├── complexity_analyzer.py     # Pattern-based complexity detection
│   ├── agentic_api_server.py      # Flask API with all endpoints
│   ├── llm_gateway.py             # LLM provider management
│   ├── guardrails_manager.py      # Input/output validation
│   ├── websocket_server.py        # Real-time updates
│   └── agentic_platform.py        # Main orchestrator
├── requirements.txt               # Python dependencies
└── README.md                      # This file
```

---

## 🎨 Code Generation Examples

### Reverse String (Python)
```python
def reverse_string(s):
    """
    Reverse a string using slicing.
    
    Time Complexity: O(n)
    Space Complexity: O(n)
    
    Args:
        s (str): Input string to reverse
        
    Returns:
        str: Reversed string
    
    Examples:
        >>> reverse_string("hello")
        'olleh'
    """
    if not s:
        return s
    return s[::-1]
```

### Fibonacci (Optimized)
```python
from functools import lru_cache

@lru_cache(maxsize=None)
def fibonacci_memoized(n):
    """
    Optimized Fibonacci with memoization.
    
    Time Complexity: O(n) with caching
    Space Complexity: O(n) for cache
    """
    if n <= 1:
        return n
    return fibonacci_memoized(n - 1) + fibonacci_memoized(n - 2)
```

### Prime Check (Optimized)
```python
def is_prime_optimized(n):
    """
    Optimized prime checking.
    
    Time Complexity: O(√n)
    Space Complexity: O(1)
    """
    if n < 2:
        return False
    if n == 2 or n == 3:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    
    # Check for divisors of form 6k ± 1
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    
    return True
```

---

## 🧪 Testing

### Quick Test Script

```python
from backend.code_generator import CodeGenerator

# Create generator
generator = CodeGenerator()

# Test problems
problems = [
    "Write a function to reverse a string",
    "Write a function to calculate factorial",
    "Write a function to check if a number is prime",
    "Write a function to find fibonacci numbers"
]

for problem in problems:
    result = generator.generate_code(problem, "python")
    print(f"\nProblem: {problem}")
    print(f"Generated: {len(result['code'])} characters")
    print(f"First 200 chars: {result['code'][:200]}...")
```

Expected output: Each problem generates 500-1500 characters of complete, working code.

---

## 📦 Dependencies

```
flask>=2.3.0
flask-cors>=4.0.0
flask-socketio>=5.3.0
python-socketio>=5.8.0
litellm>=1.0.0
openai>=1.0.0
requests>=2.31.0
```

---

## ⚙️ Configuration

### Environment Variables (Optional)

```bash
# For real LLM integration (optional - falls back to built-in templates)
export OPENAI_API_KEY=your_key_here
export ANTHROPIC_API_KEY=your_key_here
```

**Note:** The platform now works WITHOUT API keys by using built-in comprehensive templates for common problems!

---

## 🔥 What Makes This Special

### Before (Skeleton Code)
```python
def solution():
    """Mock solution"""
    # TODO: Implement solution
    pass
```

### After (Complete Implementation)
```python
def is_prime(n):
    """
    Check if a number is prime.
    
    Time Complexity: O(√n)
    Space Complexity: O(1)
    
    Args:
        n (int): Number to check
        
    Returns:
        bool: True if n is prime, False otherwise
    """
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    
    # Only check odd divisors up to √n
    i = 3
    while i * i <= n:
        if n % i == 0:
            return False
        i += 2
    
    return True


# Example usage
if __name__ == "__main__":
    test_numbers = [2, 3, 4, 17, 20, 29]
    for num in test_numbers:
        result = "PRIME" if is_prime(num) else "NOT PRIME"
        print(f"{num} is {result}")
```

---

## 🎯 Iteration & Optimization

The platform supports iterative optimization:

1. **Iteration 0:** Basic complete implementation (e.g., O(n²))
2. **Iteration 1:** Optimized implementation (e.g., O(n) with hash table)
3. **Iteration 2:** Further optimized (e.g., O(log n) binary search)
4. **Iteration 3:** Most optimized variant

Each iteration provides COMPLETE working code with improvements.

---

## 📊 Complexity Analysis

The complexity analyzer automatically detects:

- **Time Complexity:** O(1), O(log n), O(n), O(n log n), O(n²), O(n³), O(2^n)
- **Space Complexity:** O(1), O(n), O(n) stack space
- **Optimization Opportunities:** Suggests better approaches

Provides specific suggestions like:
- "Use hash table for O(1) lookups instead of nested loops"
- "Apply memoization to reduce O(2^n) to O(n)"
- "Use Sieve of Eratosthenes for multiple primes"

---

## 📝 License

MIT License

---

## 🙋 Support

The platform now generates FULL, COMPLETE, WORKING CODE for:
- ✅ String reversal
- ✅ Factorial calculation
- ✅ Fibonacci sequence
- ✅ Prime number checking  
- ✅ Palindrome detection
- ✅ Sorting algorithms
- ✅ Searching algorithms
- ✅ Sum calculations
- ✅ Maximum finding
- ✅ Generic problems

**No more skeleton code!** 🎉

---

Built with ❤️ - Enhanced Code Generator v2.0
