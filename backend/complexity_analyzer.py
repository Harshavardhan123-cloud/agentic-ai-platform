"""Complexity Analyzer for code optimization suggestions.

Analyzes code complexity and suggests optimizations.
"""

import re
import json
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime


class ComplexityAnalyzer:
    """
    Analyzes code complexity and suggests optimizations.
    
    Features:
    - Time complexity detection
    - Space complexity detection
    - Optimization opportunity detection
    - Comparison with ideal solutions
    """
    
    # Common complexity patterns
    COMPLEXITY_PATTERNS = {
        # Time complexity indicators
        'nested_loops_2': (r'for.*for', 'O(n²)', 'Nested loops detected'),
        'nested_loops_3': (r'for.*for.*for', 'O(n³)', 'Triple nested loops detected'),
        'recursion': (r'def\s+\w+', 'O(2^n)', 'Recursive calls detected'),
        'single_loop': (r'\bfor\b.*\bin\b', 'O(n)', 'Single loop detected'),
        'binary_search': (r'while.*\bmid\b', 'O(log n)', 'Binary search pattern'),
        'sorting': (r'\.sort\(|sorted\(', 'O(n log n)', 'Sorting operation'),
    }
    
    # Optimization hints
    OPTIMIZATION_HINTS = {
        'O(n²)': {
            'better': ['O(n)', 'O(n log n)'],
            'suggestions': [
                'Consider using a hash table for O(1) lookups',
                'Use sorting + two pointers approach',
                'Try divide and conquer algorithm'
            ]
        },
        'O(n³)': {
            'better': ['O(n²)', 'O(n log n)'],
            'suggestions': [
                'Reduce nested loops by using data structures',
                'Apply dynamic programming if there are overlapping subproblems',
                'Consider more efficient algorithms'
            ]
        },
        'O(2^n)': {
            'better': ['O(n)', 'O(n²)'],
            'suggestions': [
                'Use dynamic programming to cache results',
                'Convert recursion to iteration',
                'Apply memoization techniques'
            ]
        }
    }
    
    def __init__(self, llm_gateway=None):
        """
        Initialize complexity analyzer.
        
        Args:
            llm_gateway: LLM Gateway for advanced analysis
        """
        self.llm_gateway = llm_gateway
        self.analysis_history = []
    
    def analyze(
        self,
        code: str,
        language: str,
        problem_statement: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze code complexity.
        
        Args:
            code: Source code to analyze
            language: Programming language
            problem_statement: Original problem (for context)
            
        Returns:
            Analysis results with complexity and optimization suggestions
        """
        # --- ALGORITHM-BASED OVERRIDE ---
        # Regex complexity detection can be tricked by nested loops in helper functions.
        # We check key identifiers first to ensure accuracy for standard algorithms.
        override_time = None
        code_lower = code.lower()
        problem_lower = (problem_statement or "").lower()
        full_context = code_lower + " " + problem_lower
        
        # Check patterns (including snake_case and variations)
        if any(x in full_context for x in ['merge sort', 'mergesort', 'merge_sort', 'quick sort', 'quicksort', 'quick_sort', 'heap sort', 'heapsort', 'heap_sort']):
             override_time = 'O(n log n)'
        elif any(x in full_context for x in ['bubble sort', 'bubblesort', 'bubble_sort', 'insertion sort', 'insertionsort', 'insertion_sort', 'selection sort', 'selectionsort', 'selection_sort']):
             override_time = 'O(n²)'
        elif any(x in full_context for x in ['binary search', 'binarysearch', 'binary_search', 'bsearch']):
             override_time = 'O(log n)'
        elif any(x in full_context for x in ['binary tree', 'binarytree', 'bst', 'tree node', 'tree traversal', 'bfs', 'dfs', 'breadth first', 'depth first', 'linked list', 'linkedlist']):
             override_time = 'O(n)'
        
        # 1. Try Override
        time_complexity = override_time
        space_complexity = None
        
        # 2. Try LLM Analysis (if no override or for space complexity)
        if self.llm_gateway:
            try:
                llm_result = self._analyze_with_llm(code, language)
                if not time_complexity:
                    time_complexity = llm_result.get('time_complexity')
                space_complexity = llm_result.get('space_complexity')
            except Exception as e:
                print(f"LLM Complexity Analysis failed: {e}")

        # 3. Fallback to Regex
        if not time_complexity:
            time_complexity = self._detect_time_complexity(code, language)
        
        if not space_complexity:
            space_complexity = self._detect_space_complexity(code, language)
        
        # Check for optimization opportunities
        can_optimize, suggestions = self._check_optimization_opportunities(
            time_complexity,
            space_complexity,
            code,
            problem_statement
        )
        
        result = {
            'success': True,
            'complexity': {
                'time': time_complexity,
                'space': space_complexity
            },
            'can_optimize': can_optimize,
            'optimization_suggestions': suggestions,
            'timestamp': datetime.now().isoformat()
        }
        
        # Track history
        self.analysis_history.append(result)
        
        return result

    def _analyze_with_llm(self, code: str, language: str) -> Dict[str, str]:
        """Analyze complexity using LLM."""
        prompt = f"""Analyze the Time and Space complexity of this {language} code.
RETURN JSON ONLY: {{"time_complexity": "Big O", "space_complexity": "Big O"}}

Code:
{code[:2000]}
"""
        messages = [{"role": "user", "content": prompt}]
        response = self.llm_gateway.completion(messages, temperature=0.1, max_tokens=100)
        content = response['choices'][0]['message']['content']
        
        # Extract JSON
        start = content.find('{')
        end = content.rfind('}')
        if start != -1 and end != -1:
            return json.loads(content[start:end+1])
        return {}

    def _detect_time_complexity(self, code: str, language: str) -> str:
        """Detect time complexity from code patterns."""
        
        code_lower = code.lower()
        
        # Check for complexity patterns (in order of precedence)
        if re.search(self.COMPLEXITY_PATTERNS['nested_loops_3'][0], code, re.DOTALL):
            return 'O(n³)'
        
        if re.search(self.COMPLEXITY_PATTERNS['nested_loops_2'][0], code, re.DOTALL):
            return 'O(n²)'
        
        if re.search(self.COMPLEXITY_PATTERNS['recursion'][0], code):
            # Check if it's tail recursion or has memoization
            if 'memo' in code_lower or '@cache' in code_lower or '@lru_cache' in code_lower:
                return 'O(n)'
            return 'O(2^n) or O(n) with memoization'
        
        if re.search(self.COMPLEXITY_PATTERNS['sorting'][0], code):
            return 'O(n log n)'
        
        if re.search(self.COMPLEXITY_PATTERNS['binary_search'][0], code):
            return 'O(log n)'
        
        if re.search(self.COMPLEXITY_PATTERNS['single_loop'][0], code):
            return 'O(n)'
        
        # Default to constant if no patterns found
        return 'O(1) or O(n)'
    
    def _detect_space_complexity(self, code: str, language: str) -> str:
        """Detect space complexity from code patterns."""
        
        # Check for data structure allocations
        if re.search(r'\[\s*\]\s*\*|\.append\(|\.push\(', code):
            # Array/list allocation
            return 'O(n)'
        
        if re.search(r'\{.*:.*\}|dict\(|HashMap|HashSet', code):
            # Hash table allocation
            return 'O(n)'
        
        # Check for recursion (simplified - just look for def keyword)
        if 'def ' in code and any(keyword in code.lower() for keyword in ['recursive', 'recurse', 'return']):
            # Recursion uses stack space
            return 'O(n) stack space'
        
        # Default to constant
        return 'O(1)'
    
    def _check_optimization_opportunities(
        self,
        time_complexity: str,
        space_complexity: str,
        code: str,
        problem_statement: Optional[str]
    ) -> Tuple[bool, List[str]]:
        """
        Check if code can be optimized.
        
        Returns:
            Tuple of (can_optimize, suggestions_list)
        """
        suggestions = []
        can_optimize = False
        
        # Check if time complexity can be improved
        for target_complexity, hints in self.OPTIMIZATION_HINTS.items():
            if target_complexity in time_complexity:
                can_optimize = True
                suggestions.extend(hints['suggestions'])
                
                # Add specific hint about better complexity
                better_complexities = ', '.join(hints['better'])
                suggestions.insert(0, 
                    f"Current complexity is {target_complexity}. "
                    f"Can be optimized to {better_complexities}."
                )
                break
        
        # Additional heuristics
        if 'O(n²)' in time_complexity and 'hash' not in code.lower():
            suggestions.append('Use a hash table/dictionary for faster lookups')
        
        if 'O(2^n)' in time_complexity and 'memo' not in code.lower() and '@lru_cache' not in code.lower():
            suggestions.append('Add memoization to cache recursive results')
        
        return can_optimize, suggestions
    
    def generate_optimization_prompt(
        self,
        problem_statement: str,
        current_complexity: Dict[str, str],
        suggestions: List[str]
    ) -> str:
        """
        Generate an optimized problem prompt for next iteration.
        
        Args:
            problem_statement: Original problem
            current_complexity: Current time/space complexity
            suggestions: Optimization suggestions
            
        Returns:
            Enhanced prompt for optimization
        """
        time = current_complexity.get('time', 'Unknown')
        
        prompt = f"{problem_statement}\n\n"
        prompt += f"OPTIMIZATION REQUIREMENT:\n"
        prompt += f"- Current time complexity: {time}\n"
        prompt += f"- Optimize using: {suggestions[0] if suggestions else 'more efficient algorithm'}\n"
        prompt += f"- Target better time/space complexity"
        
        return prompt
    
    def compare_solutions(
        self,
        solution1: Dict[str, Any],
        solution2: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compare two solutions.
        
        Args:
            solution1: First solution analysis
            solution2: Second solution analysis
            
        Returns:
            Comparison results
        """
        complexity1 = solution1.get('complexity', {})
        complexity2 = solution2.get('complexity', {})
        
        # Simple comparison (could be enhanced with complexity ordering)
        return {
            'solution1_time': complexity1.get('time'),
            'solution2_time': complexity2.get('time'),
            'winner': 'solution2' if solution2.get('can_optimize') == False else 'solution1',
            'improvement': 'Optimized' if len(complexity2.get('time', '')) < len(complexity1.get('time', '')) else 'Similar'
        }
    
    def get_history(self) -> list:
        """Get analysis history."""
        return self.analysis_history
