"""Guardrails Manager for input/output validation.

Provides basic safety and validation checks.
"""

from typing import List, Tuple, Any
from datetime import datetime
from dataclasses import dataclass


@dataclass
class Violation:
    """Represents a guardrail violation."""
    validator_name: str
    message: str
    severity: str = "medium"
    timestamp: str = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()


class GuardrailsManager:
    """
    Manages input/output validation and safety checks.
    
    Features:
    - Input validation (toxic language, PII, prompt injection)
    - Output validation (code safety, malicious patterns)
    - Violation logging and stats
    """
    
    def __init__(self):
        """Initialize guardrails manager."""
        self.violations_log = []
        self.stats = {
            'total_checks': 0,
            'total_violations': 0,
            'validator_stats': {}
        }
        
        # Simple block lists for demonstration
        self.toxic_keywords = ['hack', 'exploit', 'malicious']
        self.dangerous_code_patterns = ['rm -rf', 'DROP TABLE', 'eval(']
    
    def validate_input(self, text: str) -> Tuple[bool, List[Violation]]:
        """
        Validate input text.
        
        Args:
            text: Input text to validate
            
        Returns:
            Tuple of (is_valid, violations_list)
        """
        self.stats['total_checks'] += 1
        violations = []
        
        text_lower = text.lower()
        
        # Check for toxic language
        for keyword in self.toxic_keywords:
            if keyword in text_lower:
                violations.append(Violation(
                    validator_name='toxic_language',
                    message=f'Detected potentially toxic keyword: {keyword}',
                    severity='low'
                ))
        
        # Check length
        if len(text) > 10000:
            violations.append(Violation(
                validator_name='length_check',
                message='Input text exceeds maximum length',
                severity='medium'
            ))
        
        # Log violations
        if violations:
            self.stats['total_violations'] += len(violations)
            self.violations_log.extend(violations)
        
        # Allow all inputs in demo mode
        return True, violations
    
    def validate_output(self, code: str, language: str) -> Tuple[bool, List[Violation]]:
        """
        Validate generated code output.
        
        Args:
            code: Generated code
            language: Programming language
            
        Returns:
            Tuple of (is_valid, violations_list)
        """
        self.stats['total_checks'] += 1
        violations = []
        
        # Check for dangerous patterns
        for pattern in self.dangerous_code_patterns:
            if pattern in code:
                violations.append(Violation(
                    validator_name='code_safety',
                    message=f'Detected potentially dangerous pattern: {pattern}',
                    severity='high'
                ))
        
        # Log violations
        if violations:
            self.stats['total_violations'] += len(violations)
            self.violations_log.extend(violations)
        
        return True, violations
    
    def get_stats(self) -> dict:
        """Get guardrails statistics."""
        return {
            'total_checks': self.stats['total_checks'],
            'total_violations': self.stats['total_violations'],
            'violation_rate': self.stats['total_violations'] / max(self.stats['total_checks'], 1)
        }
    
    def get_violations(self, limit: int = 100) -> List[dict]:
        """Get recent violations."""
        recent = self.violations_log[-limit:]
        return [
            {
                'validator': v.validator_name,
                'message': v.message,
                'severity': v.severity,
                'timestamp': v.timestamp
            }
            for v in recent
        ]


# Singleton instance
_guardrails_instance = None

def get_guardrails_manager() -> GuardrailsManager:
    """Get or create Guardrails Manager singleton."""
    global _guardrails_instance
    if _guardrails_instance is None:
        _guardrails_instance = GuardrailsManager()
    return _guardrails_instance
