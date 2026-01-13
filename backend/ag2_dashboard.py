"""
AG2 (AutoGen 2) Multi-Agent Dashboard Layer

This module provides a multi-agent architecture using AG2 framework
with comprehensive metrics and dashboard support.
"""

import os
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import json


@dataclass
class AgentMetrics:
    """Metrics for a single agent."""
    agent_name: str
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    total_tokens: int = 0
    avg_response_time: float = 0.0
    last_activity: str = ""
    status: str = "idle"
    tasks_completed: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "agent_name": self.agent_name,
            "total_calls": self.total_calls,
            "successful_calls": self.successful_calls,
            "failed_calls": self.failed_calls,
            "success_rate": round(self.successful_calls / max(self.total_calls, 1) * 100, 2),
            "total_tokens": self.total_tokens,
            "avg_response_time": round(self.avg_response_time, 3),
            "last_activity": self.last_activity,
            "status": self.status,
            "tasks_completed": len(self.tasks_completed)
        }


@dataclass
class DashboardMetrics:
    """Overall dashboard metrics."""
    total_requests: int = 0
    total_code_generations: int = 0
    total_complexity_analyses: int = 0
    total_optimizations: int = 0
    languages_used: Dict[str, int] = field(default_factory=dict)
    avg_code_length: float = 0.0
    llm_provider: str = "none"
    model_used: str = "none"
    uptime_seconds: int = 0
    start_time: str = ""
    
    def to_dict(self) -> dict:
        return {
            "total_requests": self.total_requests,
            "total_code_generations": self.total_code_generations,
            "total_complexity_analyses": self.total_complexity_analyses,
            "total_optimizations": self.total_optimizations,
            "languages_used": self.languages_used,
            "avg_code_length": round(self.avg_code_length, 0),
            "llm_provider": self.llm_provider,
            "model_used": self.model_used,
            "uptime_seconds": self.uptime_seconds,
            "start_time": self.start_time
        }


class AG2Agent:
    """Base AG2 Agent with metrics tracking."""
    
    def __init__(self, name: str, description: str, llm_config: Optional[dict] = None):
        self.name = name
        self.description = description
        self.llm_config = llm_config or {}
        self.metrics = AgentMetrics(agent_name=name)
        self._start_time = datetime.now()
    
    def record_call(self, success: bool, tokens: int = 0, response_time: float = 0.0, task: str = ""):
        """Record a call to this agent."""
        self.metrics.total_calls += 1
        if success:
            self.metrics.successful_calls += 1
            if task:
                self.metrics.tasks_completed.append(task)
        else:
            self.metrics.failed_calls += 1
        
        self.metrics.total_tokens += tokens
        
        # Update average response time
        if self.metrics.total_calls > 0:
            prev_avg = self.metrics.avg_response_time
            self.metrics.avg_response_time = (
                prev_avg * (self.metrics.total_calls - 1) + response_time
            ) / self.metrics.total_calls
        
        self.metrics.last_activity = datetime.now().isoformat()
    
    def set_status(self, status: str):
        """Set agent status."""
        self.metrics.status = status
    
    def get_metrics(self) -> dict:
        """Get agent metrics."""
        return self.metrics.to_dict()


class CodeGeneratorAgent(AG2Agent):
    """Agent responsible for code generation."""
    
    def __init__(self, llm_gateway=None):
        super().__init__(
            name="CodeGenerator",
            description="Generates complete, working code solutions using LLM"
        )
        self.llm_gateway = llm_gateway
    
    async def generate(self, problem: str, language: str) -> dict:
        """Generate code for a problem."""
        import time
        start_time = time.time()
        self.set_status("generating")
        
        try:
            # This would call the actual code generator
            result = {"success": True, "code": "# Generated code"}
            response_time = time.time() - start_time
            self.record_call(True, tokens=500, response_time=response_time, task=f"generate_{language}")
            self.set_status("idle")
            return result
        except Exception as e:
            self.record_call(False, response_time=time.time() - start_time)
            self.set_status("error")
            return {"success": False, "error": str(e)}


class ComplexityAnalyzerAgent(AG2Agent):
    """Agent responsible for complexity analysis."""
    
    def __init__(self, llm_gateway=None):
        super().__init__(
            name="ComplexityAnalyzer",
            description="Analyzes time and space complexity of code"
        )
        self.llm_gateway = llm_gateway
    
    async def analyze(self, code: str) -> dict:
        """Analyze code complexity."""
        self.set_status("analyzing")
        try:
            result = {"time_complexity": "O(n)", "space_complexity": "O(1)"}
            self.record_call(True, tokens=200, task="analyze_complexity")
            self.set_status("idle")
            return result
        except Exception as e:
            self.record_call(False)
            self.set_status("error")
            return {"error": str(e)}


class OptimizerAgent(AG2Agent):
    """Agent responsible for code optimization suggestions."""
    
    def __init__(self, llm_gateway=None):
        super().__init__(
            name="Optimizer",
            description="Suggests optimizations for generated code"
        )
        self.llm_gateway = llm_gateway
    
    async def optimize(self, code: str, complexity: dict) -> dict:
        """Suggest optimizations."""
        self.set_status("optimizing")
        try:
            result = {"suggestions": ["Use memoization", "Consider iterative approach"]}
            self.record_call(True, tokens=300, task="optimize")
            self.set_status("idle")
            return result
        except Exception as e:
            self.record_call(False)
            self.set_status("error")
            return {"error": str(e)}


class GuardrailsAgent(AG2Agent):
    """Agent responsible for input/output validation."""
    
    def __init__(self):
        super().__init__(
            name="Guardrails",
            description="Validates inputs and outputs for safety"
        )
        self.violations = []
    
    def validate(self, text: str, is_input: bool = True) -> dict:
        """Validate text for safety."""
        self.set_status("validating")
        try:
            # Basic validation
            is_valid = True
            violations = []
            
            if len(text) > 50000:
                is_valid = False
                violations.append("Text too long")
            
            self.record_call(True, task="validate_input" if is_input else "validate_output")
            self.set_status("idle")
            
            return {"is_valid": is_valid, "violations": violations}
        except Exception as e:
            self.record_call(False)
            self.set_status("error")
            return {"is_valid": False, "violations": [str(e)]}

class TestGeneratorAgent(AG2Agent):
    """Agent responsible for generating unit tests."""
    
    def __init__(self, llm_gateway=None):
        super().__init__(
            name="TestGenerator",
            description="Generates comprehensive unit tests"
        )
        self.llm_gateway = llm_gateway

    async def generate_tests(self, code: str, language: str) -> dict:
        """Generate tests for code."""
        self.set_status("generating_tests")
        try:
            self.record_call(True, tokens=400, task="generate_tests")
            self.set_status("idle")
            return {"success": True}
        except Exception as e:
            self.record_call(False)
            self.set_status("error")
            return {"error": str(e)}


class CodeReviewerAgent(AG2Agent):
    """Agent responsible for code review."""
    
    def __init__(self, llm_gateway=None):
        super().__init__(
            name="CodeReviewer",
            description="Reviews code for best practices and bugs"
        )
        self.llm_gateway = llm_gateway

    async def review(self, code: str) -> dict:
        """Review code."""
        self.set_status("reviewing")
        try:
            self.record_call(True, tokens=300, task="code_review")
            self.set_status("idle")
            return {"approved": True}
        except Exception as e:
            self.record_call(False)
            self.set_status("error")
            return {"error": str(e)}


class VisualizationAgent(AG2Agent):
    """Agent responsible for generating algorithm visualizations."""
    
    def __init__(self, llm_gateway=None):
        super().__init__(
            name="Visualizer",
            description="Generates animated execution traces"
        )
        self.llm_gateway = llm_gateway

    async def generate_visualization(self, code: str, language: str) -> dict:
        """Generate visualization trace."""
        self.set_status("visualizing")
        try:
            # In a real async environment, we'd await this
            # For now, we record the call
            self.record_call(True, tokens=1000, task="generate_trace")
            self.set_status("idle")
            return {"success": True}
        except Exception as e:
            self.record_call(False)
            self.set_status("error")
            return {"error": str(e)}


class TextExplainerAgent(AG2Agent):
    """Agent for text explanations."""
    def __init__(self, llm_gateway=None):
        super().__init__(name="TextExplainer", description="Generates detailed text analysis")

class AudioExplainerAgent(AG2Agent):
    """Agent for audio generation."""
    def __init__(self, llm_gateway=None):
        super().__init__(name="AudioExplainer", description="Generates audio walkthroughs")


class AG2Dashboard:
    """
    Main Dashboard Controller for AG2 Multi-Agent System.
    
    Provides:
    - Real-time metrics for all agents
    - System-wide statistics
    - Performance monitoring
    - Activity tracking
    """
    
    def __init__(self, llm_gateway=None):
        self.start_time = datetime.now()
        self.llm_gateway = llm_gateway
        
        # Initialize agents
        self.agents = {
            "code_generator": CodeGeneratorAgent(llm_gateway),
            "complexity_analyzer": ComplexityAnalyzerAgent(llm_gateway),
            "optimizer": OptimizerAgent(llm_gateway),
            "guardrails": GuardrailsAgent(),
            "test_generator": TestGeneratorAgent(llm_gateway),
            "code_reviewer": CodeReviewerAgent(llm_gateway),
            "visualizer": VisualizationAgent(llm_gateway),
            "text_explainer": TextExplainerAgent(llm_gateway),
            "audio_explainer": AudioExplainerAgent(llm_gateway)
        }

        
        # Dashboard metrics
        self.metrics = DashboardMetrics(
            start_time=self.start_time.isoformat()
        )
        
        # Request history
        self.request_history = []
    
    def record_request(self, request_type: str, language: str = "", success: bool = True, 
                       code_length: int = 0, provider: str = "", model: str = ""):
        """Record a request to the system."""
        self.metrics.total_requests += 1
        
        if request_type == "code_generation":
            self.metrics.total_code_generations += 1
            if language:
                self.metrics.languages_used[language] = self.metrics.languages_used.get(language, 0) + 1
        elif request_type == "complexity_analysis":
            self.metrics.total_complexity_analyses += 1
        elif request_type == "optimization":
            self.metrics.total_optimizations += 1
        
        # Update average code length
        if code_length > 0:
            total_gen = self.metrics.total_code_generations
            prev_avg = self.metrics.avg_code_length
            self.metrics.avg_code_length = (prev_avg * (total_gen - 1) + code_length) / total_gen
        
        # Update LLM info
        if provider:
            self.metrics.llm_provider = provider
        if model:
            self.metrics.model_used = model
        
        # Update uptime
        self.metrics.uptime_seconds = int((datetime.now() - self.start_time).total_seconds())
        
        # Add to history
        self.request_history.append({
            "timestamp": datetime.now().isoformat(),
            "type": request_type,
            "language": language,
            "success": success,
            "code_length": code_length
        })
        
        # Keep only last 100 requests
        if len(self.request_history) > 100:
            self.request_history = self.request_history[-100:]
    
    def get_dashboard_data(self) -> dict:
        """Get complete dashboard data."""
        # Update uptime
        self.metrics.uptime_seconds = int((datetime.now() - self.start_time).total_seconds())
        
        return {
            "system": self.metrics.to_dict(),
            "agents": {name: agent.get_metrics() for name, agent in self.agents.items()},
            "recent_activity": self.request_history[-10:],
            "health": self._get_health_status()
        }
    
    def _get_health_status(self) -> dict:
        """Get system health status."""
        agent_statuses = [agent.metrics.status for agent in self.agents.values()]
        
        return {
            "status": "healthy" if all(s != "error" for s in agent_statuses) else "degraded",
            "agents_active": sum(1 for s in agent_statuses if s != "error"),
            "agents_total": len(self.agents),
            "llm_available": self.metrics.llm_provider != "none"
        }
    
    def get_agent(self, agent_name: str) -> Optional[AG2Agent]:
        """Get an agent by name."""
        return self.agents.get(agent_name)


# Singleton instance
_dashboard_instance = None

def get_dashboard(llm_gateway=None) -> AG2Dashboard:
    """Get or create Dashboard singleton."""
    global _dashboard_instance
    if _dashboard_instance is None:
        _dashboard_instance = AG2Dashboard(llm_gateway)
    return _dashboard_instance
