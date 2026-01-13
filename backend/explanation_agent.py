"""
Explanation Agents for the Agentic AI Platform.

1. TextExplanationAgent: Generates detailed text breakdowns.
2. AudioExplanationAgent: Generates audio conversions of explanations.
"""

import os
import uuid
from typing import Dict, Any

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
    """Agent responsible for generating audio explanations using OpenAI TTS."""
    
    def __init__(self, llm_gateway, audio_dir="frontend/public/audio_cache"):
        self.llm_gateway = llm_gateway
        self.audio_dir = audio_dir
        
        # Ensure cache directory exists
        os.makedirs(audio_dir, exist_ok=True)
        
    def generate_audio(self, code: str, problem: str) -> Dict[str, Any]:
        """
        1. Generate a short, conversational script using LLM.
        2. Convert script to Audio using OpenAI TTS API.
        3. Return path to audio file.
        """
        if not self.llm_gateway:
            return {"success": False, "error": "LLM Gateway not available"}
            
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
            script = ""
            try:
                response = self.llm_gateway.completion(
                    messages=[
                        {"role": "system", "content": script_prompt},
                        {"role": "user", "content": f"Problem: {problem}\nCode:\n{code}"}
                    ],
                    temperature=0.5,
                    max_tokens=600
                )
                script = response.get('choices', [{}])[0].get('message', {}).get('content', '')
            except Exception as llm_err:
                print(f"⚠️ [AudioAgent] LLM Generation Failed: {llm_err}")
                script = "Here is a summary of the solution. The code implements an optimized algorithm to solve the problem efficiently."

            print("🎤 [AudioAgent] LLM response received/handled.")
            if not script or script.startswith("Error:"):
                print(f"⚠️ [AudioAgent] Skipping audio generation due to invalid script content.")
                return {
                    "success": True,
                    "audio_url": None,
                    "script": script or "Script generation failed.",
                    "provider": "llm_text_only",
                    "warning": "Audio skipped (Error in script)."
                }

            print(f"🎤 [AudioAgent] Script generated ({len(script)} chars). Generating audio with OpenAI TTS...")
            
            # 2. Convert to Audio using OpenAI TTS API
            try:
                openai_key = os.getenv('OPENAI_API_KEY')
                if not openai_key:
                    print("⚠️ [AudioAgent] OPENAI_API_KEY not found, returning text only.")
                    return {
                        "success": True,
                        "audio_url": None,
                        "script": script,
                        "provider": "llm_text_only",
                        "warning": "Audio skipped (No OpenAI API key for TTS)."
                    }
                
                from openai import OpenAI
                client = OpenAI(api_key=openai_key)
                
                filename = f"explanation_{uuid.uuid4().hex[:8]}.mp3"
                filepath = os.path.join(self.audio_dir, filename)
                
                print(f"🎤 [AudioAgent] Calling OpenAI TTS API...")
                response = client.audio.speech.create(
                    model="tts-1",
                    voice="alloy",
                    input=script
                )
                
                # Save the audio file
                response.stream_to_file(filepath)
                print(f"🎤 [AudioAgent] Audio saved to {filepath}")
                
                # Return relative path for frontend
                relative_path = f"/audio_cache/{filename}"
                
                return {
                    "success": True,
                    "audio_url": relative_path,
                    "script": script,
                    "provider": "openai_tts"
                }

            except Exception as audio_err:
                print(f"⚠️ [AudioAgent] OpenAI TTS Failed: {audio_err}")
                return {
                    "success": True, 
                    "audio_url": None,
                    "script": script,
                    "provider": "llm_text_only",
                    "warning": f"Audio generation failed: {str(audio_err)}"
                }
            
        except Exception as e:
            print(f"❌ [AudioAgent] Critical Failure: {e}")
            return {"success": False, "error": str(e)}

