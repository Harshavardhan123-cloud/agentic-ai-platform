
"""
Visualization Generator Service

Generates execution traces for algorithms using LLM.
"""

import json
from typing import Dict, Any, List

class VisualizationGenerator:
    """Generates execution traces for algorithm visualization."""
    
    def __init__(self, llm_gateway):
        self.llm_gateway = llm_gateway
        
    def generate_trace(self, code: str, language: str, problem_type: str = "generic") -> Dict[str, Any]:
        """Generate trace with Graph and Tree support."""
        if not self.llm_gateway:
            return {"error": "LLM Gateway not available"}
            
        system_prompt = """You are an Algorithm Visualizer. 
Your goal is to simulate the execution of the provided code for a robust sample input and produce a step-by-step JSON execution trace.

OUTPUT FORMAT (Strict JSON):
{
  "visualization_type": "array" | "matrix" | "graph" | "tree" | "generic",
  "data_structure_name": "visualization_data", // ALWAYS use this exact string
  "initial_label": "Initial State",
  "steps": [
    {
      "step_id": 1,
      "description": "Short explanation",
      "active_indices": [0, 1], // Indices/Nodes being accessed/modified in this step
      "variables": {
        "visualization_data": [1, 2, 3], // The MAIN Array/Graph/Tree object for the visualizer
        "i": 0,
        "j": 1
      }
    }
  ]
}

RULES:
1. **Arrays**: For Sorting/Searching, use "array". Input ex: [5, 2, 9, 1, 5]. `visualization_data` is the list.
2. **Graphs**: For BFS/DFS/Shortest Path, use "graph". `visualization_data` must be: `{"nodes": [1, 2, 3], "edges": [[1, 2], [2, 3]]}`.
3. **Trees**: For Tree traversals, use "tree". `visualization_data` is root object: `{"id": 1, "val": 5, "left": {...}, "right": {...}}`.
4. **Generic**: For anything else (DP, Math, Text processing), use "generic". `visualization_data` can be any JSON object showing state.
5. **Inference**: If 'problem_type' is 'generic', INFER the best type based on the code.
6. **Simulation**: If code is ONLY definitions (Class/Def), YOU MUST SIMULATE a simple usage (e.g. create a tree, run the function) to generate the trace.
7. Trace max 50 steps.
8. ALWAYS use "visualization_data" as the key in `variables` for the structure being visualized.
"""

        user_prompt = f"""
Language: {language}
Problem Type: {problem_type} (If generic, please INFER the data structure from code)

Code:
{code}

Generate the JSON execution trace now.
"""

        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            response = self.llm_gateway.completion(
                messages=messages,
                temperature=0.1,  # Low temperature for deterministic JSON
                max_tokens=3000
            )
            
            content = response['choices'][0]['message']['content']
            
            # Robust JSON extraction
            try:
                # 1. Try stripping
                json_data = json.loads(content.strip())
                return json_data
            except json.JSONDecodeError:
                pass

            # 2. Try extracting from code blocks
            import re
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', content, re.DOTALL)
            if not json_match:
                json_match = re.search(r'```\s*(\{.*?\})\s*```', content, re.DOTALL)

            # 3. Try finding first { and last } (Aggressive extraction)
            # 3. Try finding first { and last } (Aggressive extraction)
            try:
                first_brace = content.find('{')
                last_brace = content.rfind('}')
                if first_brace != -1 and last_brace != -1:
                    json_str = content[first_brace:last_brace+1]
                    return json.loads(json_str)
            except:
                pass
            
            # --- RETRY LOGIC FOR STATIC CODE ---
            # If we reached here, NO valid JSON was found.
            # If the code seems to be just definitions, allow ONE retry forcing simulation.
            
            if "class" in code or "def" in code:
                print("Visualization: Initial attempt failed for static code. Retrying with Force Simulation...")
                retry_system_prompt = getattr(self, '_retry_prompt', """You are a Code Simulator.
The user provided a Class or Function definition but no usage code.
JOB: Invent a valid usage scenario (instantiate class, call function) and trace it.
OUTPUT: Strict JSON only (same format as before).
DO NOT explain. DO NOT say "Here is the trace". JUST. THE. JSON.
""")
                retry_messages = [
                    {"role": "system", "content": retry_system_prompt},
                    {"role": "user", "content": f"Code:\n{code}\n\nERROR: You failed to output JSON last time. SIMULATE THIS CODE NOW."}
                ]
                try:
                    retry_resp = self.llm_gateway.completion(retry_messages, temperature=0.2, max_tokens=3000)
                    retry_content = retry_resp['choices'][0]['message']['content']
                    # Aggressive extract on retry
                    fb = retry_content.find('{')
                    lb = retry_content.rfind('}')
                    if fb != -1 and lb != -1:
                        return json.loads(retry_content[fb:lb+1])
                except Exception as retry_err:
                    print(f"Retry failed: {retry_err}")

                except Exception as retry_err:
                    print(f"Retry failed: {retry_err}")

            # 4. Final Fallback: Return a simple "Definition" trace (Static View)
            # This runs if LLM failed to simulate execution.
            return {
                "visualization_type": "tree" if "tree" in problem_type else "generic",
                "data_structure_name": "visualization_data",
                "initial_label": "Code Structure (Static)",
                "steps": [
                    {
                        "step_id": 1,
                        "description": "Auto-simulation failed. Showing static code structure.",
                        "active_indices": [],
                        "variables": {
                            "visualization_data": {
                                "id": "root", 
                                "val": "Definition Only", 
                                "note": "Add a 'main' block to see execution."
                            }
                        }
                    }
                ]
            }

            raise ValueError(f"No valid JSON found in response. First 100 chars: {content[:100]}...")
            
        except Exception as e:
            print(f"Visualization generation error: {e}")
            # Fallback trace
            return {
                "visualization_type": "generic",
                "data_structure_name": "error",
                "initial_label": "Visualization Error",
                "steps": [
                    {
                        "step_id": 1,
                        "description": f"Failed to generate visualization trace: {str(e)}",
                        "active_indices": [],
                        "variables": {"error": "Try again or use a simpler algorithm"}
                    }
                ]
            } 
