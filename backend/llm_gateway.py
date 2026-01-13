"""LLM Gateway for routing requests to multiple providers.

Supports Together AI, Groq, OpenAI, and Gemini APIs.
"""

import os
from typing import Dict, Any, List, Optional


class LLMGateway:
    """
    LLM Gateway for code generation.
    
    Supports multiple providers with automatic fallback.
    """
    
    def __init__(self):
        """Initialize LLM Gateway."""
        self.stats = {
            'total_requests': 0,
            'total_tokens': 0,
            'provider_breakdown': {}
        }
    
    def completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate completion using LLM.
        """
        # Try Groq (PRIORITY 1)
        groq_key = os.getenv('GROQ_API_KEY')
        if groq_key:
            try:
                # Note: model parameter is ignored by _call_groq in favor of 'llama-3.3-70b-versatile'
                result = self._call_groq(messages, groq_key, temperature, max_tokens)
                if result:
                    return result
            except Exception as e:
                print(f"❌ Groq error: {e}")

        # Try Together AI (PRIORITY 2)
        together_key = os.getenv('TOGETHER_API_KEY')
        if together_key:
            try:
                result = self._call_together(messages, together_key, model, temperature, max_tokens)
                if result:
                    return result
            except Exception as e:
                print(f"❌ Together AI error: {e}")
        
        # Try Gemini (PRIORITY 3)
        gemini_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
        if gemini_key:
            try:
                result = self._call_gemini(messages, gemini_key, temperature, max_tokens)
                if result:
                    return result
            except Exception as e:
                print(f"❌ Gemini error: {e}")
        
        # Try OpenAI (PRIORITY 4 - Fallback)
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key:
            try:
                result = self._call_openai(messages, openai_key, temperature, max_tokens)
                if result:
                    return result
            except Exception as e:
                print(f"❌ OpenAI error: {e}")
        
        # No API available
        print("⚠️ No LLM API available! Set TOGETHER_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY")
        return {
            'choices': [{
                'message': {
                    'role': 'assistant',
                    'content': 'Error: No LLM API key configured. Please set GROQ_API_KEY, TOGETHER_API_KEY, or OPENAI_API_KEY environment variable.'
                }
            }],
            'provider': 'none',
            'model': 'none'
        }
    
    def _call_together(
        self,
        messages: List[Dict[str, str]],
        api_key: str,
        model: str,
        temperature: float,
        max_tokens: Optional[int]
    ) -> Optional[Dict[str, Any]]:
        """Call Together AI API."""
        print(f"🔑 Using Together AI key: ...{api_key[-8:]}")
        
        from together import Together
        
        client = Together(api_key=api_key)
        
        # Use a good code model
        if 'llama' not in model.lower() and 'code' not in model.lower():
            model = "meta-llama/Llama-3.3-70B-Instruct-Turbo"
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens or 2000,
        )
        
        self.stats['total_requests'] += 1
        print(f"✅ Together AI call successful (model: {model})")
        
        return {
            'choices': [{
                'message': {
                    'role': 'assistant',
                    'content': response.choices[0].message.content
                }
            }],
            'provider': 'together',
            'model': model
        }
    
    def _call_groq(
        self,
        messages: List[Dict[str, str]],
        api_key: str,
        temperature: float,
        max_tokens: Optional[int]
    ) -> Optional[Dict[str, Any]]:
        """Call Groq API."""
        print(f"🔑 Using Groq key: ...{api_key[-8:]}")
        
        from groq import Groq
        
        client = Groq(api_key=api_key)
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens or 2000,
        )
        
        self.stats['total_requests'] += 1
        print(f"✅ Groq call successful")
        
        return {
            'choices': [{
                'message': {
                    'role': 'assistant',
                    'content': response.choices[0].message.content
                }
            }],
            'provider': 'groq',
            'model': 'llama-3.3-70b-versatile'
        }
    
    def _call_gemini(
        self,
        messages: List[Dict[str, str]],
        api_key: str,
        temperature: float,
        max_tokens: Optional[int]
    ) -> Optional[Dict[str, Any]]:
        """Call Google Gemini API."""
        print(f"🔑 Using Gemini key: ...{api_key[-8:]}")
        
        import google.generativeai as genai
        
        genai.configure(api_key=api_key)
        
        # Build content from messages
        prompt = ""
        for msg in messages:
            if msg['role'] == 'system':
                prompt += f"Instructions: {msg['content']}\n\n"
            else:
                prompt += f"{msg['content']}\n"
        
        model = genai.GenerativeModel('gemini-pro')
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens or 2000,
            )
        )
        
        self.stats['total_requests'] += 1
        print(f"✅ Gemini call successful")
        
        return {
            'choices': [{
                'message': {
                    'role': 'assistant',
                    'content': response.text
                }
            }],
            'provider': 'gemini',
            'model': 'gemini-pro'
        }
    
    def _call_openai(
        self,
        messages: List[Dict[str, str]],
        api_key: str,
        temperature: float,
        max_tokens: Optional[int]
    ) -> Optional[Dict[str, Any]]:
        """Call OpenAI API."""
        print(f"🔑 Using OpenAI key: ...{api_key[-8:]}")
        
        from openai import OpenAI
        
        client = OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens or 2000
        )
        
        self.stats['total_requests'] += 1
        print(f"✅ OpenAI call successful")
        
        return {
            'choices': [{
                'message': {
                    'role': response.choices[0].message.role,
                    'content': response.choices[0].message.content
                }
            }],
            'provider': 'openai',
            'model': 'gpt-4o-mini'
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get gateway statistics."""
        return self.stats


# Singleton instance
_gateway_instance = None

def get_llm_gateway() -> LLMGateway:
    """Get or create LLM Gateway singleton."""
    global _gateway_instance
    if _gateway_instance is None:
        _gateway_instance = LLMGateway()
    return _gateway_instance
