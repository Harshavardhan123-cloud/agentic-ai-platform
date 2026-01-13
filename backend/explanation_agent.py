"""
Explanation Agents for the Agentic AI Platform.

1. TextExplanationAgent: Generates detailed text breakdowns.
2. AudioExplanationAgent: Generates audio conversions of explanations.
"""

import os
import uuid
from typing import Dict, Any
from gtts import gTTS

class TextExplanationAgent:
    """Agent responsible for generating detailed text explanations."""
    
    def __init__(self, llm_gateway):
        self.llm_gateway = llm_gateway
        
    def generate_explanation(self, code: str, problem: str) -> Dict[str, Any]:
        """Generate a deep-dive text explanation."""
        if not self.llm_gateway:
            return {"error": "LLM Gateway not available"}
            
        system_prompt = """You are a Senior Computer Science Instructor.
Your goal is to explain the provided code/algorithm in depth to a student.

Output Format: Markdown
Structure:
1. **Concept**: High-level summary of the approach (1-2 sentences).
2. **Step-by-Step Walkthrough**: Numbered list explaining the logic flow.
3. **Complexity Analysis**: Why is it O(n) or O(log n)?
4. **Key Takeaway**: One crucial thing to remember.

Keep it clear, educational, and engaging.
"""
        
        user_prompt = f"""
Problem: {problem}

Code:
{code}

Explain this solution in detail.
"""

        try:
            response = self.llm_gateway.completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            return {
                "success": True,
                "explanation": response['choices'][0]['message']['content'],
                "provider": response.get('provider', 'unknown')
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


class AudioExplanationAgent:
    """Agent responsible for generating audio explanations."""
    
    def __init__(self, llm_gateway, audio_dir="frontend/public/audio_cache"):
        self.llm_gateway = llm_gateway
        self.audio_dir = audio_dir
        
        # Ensure cache directory exists
        os.makedirs(audio_dir, exist_ok=True)
        
    def generate_audio(self, code: str, problem: str) -> Dict[str, Any]:
        """
        1. Generate a short, conversational script using LLM.
        2. Convert script to Audio using gTTS.
        3. Return path to audio file.
        """
        if not self.llm_gateway:
            return {"error": "LLM Gateway not available"}
            
        # Step 1: Generate Script
        script_prompt = """You are a Tech Podcast Host.
Summarize this coding problem and solution into a short, engaging 30-45 second script for audio.
Focus on the "Aha!" moment and the core logic.
Do not read code line-by-line. Use natural, conversational English.
Start with: "Here's how this code works..."
"""
        
        try:
            # 1. Get Script
            print("🎤 [AudioAgent] Requesting script generation from LLM...")
            try:
                response = self.llm_gateway.completion(
                    messages=[
                        {"role": "system", "content": script_prompt},
                        {"role": "user", "content": f"Problem: {problem}\nCode:\n{code}"}
                    ],
                    temperature=0.5,
                    max_tokens=600
                )
            except Exception as e:
                print(f"❌ [AudioAgent] LLM Gateway Crash: {e}")
                raise e
            
            print("🎤 [AudioAgent] LLM response received.")
            script = response.get('choices', [{}])[0].get('message', {}).get('content', '')
            if not script:
                raise ValueError("Empty script from LLM")

            print(f"🎤 [AudioAgent] Script generated ({len(script)} chars). Generating audio with gTTS...")
            
            # 2. Convert to Audio (gTTS)
            filename = f"explanation_{uuid.uuid4().hex[:8]}.mp3"
            filepath = os.path.join(self.audio_dir, filename)
            
            print(f"🎤 [AudioAgent] Saving to {filepath}...")
            tts = gTTS(text=script, lang='en', slow=False)
            tts.save(filepath)
            print("🎤 [AudioAgent] Audio saved successfully.")
            
            # Return relative path for frontend
            relative_path = f"/audio_cache/{filename}"
            
            return {
                "success": True,
                "audio_url": relative_path,
                "script": script,
                "provider": "gTTS"
            }
            
        except Exception as e:
            print(f"Audio generation failed: {e}")
            return {"success": False, "error": str(e)}
