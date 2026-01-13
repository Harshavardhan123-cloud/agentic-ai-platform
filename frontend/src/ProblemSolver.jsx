import React, { useState } from 'react'
import AlgorithmVisualizer from './AlgorithmVisualizer'
import { useAuth } from './AuthContext'
import './ProblemSolver.css'

const ProblemSolver = () => {
    const [problemStatement, setProblemStatement] = useState('')
    const [language, setLanguage] = useState('python')
    const [loading, setLoading] = useState(false)
    const [generatedCode, setGeneratedCode] = useState(null)
    const [complexity, setComplexity] = useState(null)
    const [error, setError] = useState('')
    const [showResult, setShowResult] = useState(false)
    const [showVisualizer, setShowVisualizer] = useState(false)

    // New Feature State
    const [explanation, setExplanation] = useState(null)
    const [loadingExplanation, setLoadingExplanation] = useState(false)
    const [audioUrl, setAudioUrl] = useState(null)
    const [audioScript, setAudioScript] = useState(null)
    const [loadingAudio, setLoadingAudio] = useState(false)

    const { getAuthHeader } = useAuth()

    const getExplanation = async () => {
        if (!generatedCode) return;
        setLoadingExplanation(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                    code: generatedCode.code,
                    problem_statement: generatedCode.problem_statement
                })
            });
            const data = await res.json();
            if (data.success) {
                setExplanation(data.explanation);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingExplanation(false);
        }
    };

    const getAudio = async () => {
        if (!generatedCode) return;
        setLoadingAudio(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/explain-audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({
                    code: generatedCode.code,
                    problem_statement: generatedCode.problem_statement
                })
            });
            const data = await res.json();
            if (data.success) {
                setAudioUrl(data.audio_url);
                setAudioScript(data.script);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAudio(false);
        }
    };

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

    const LANGUAGES = [
        'python', 'javascript', 'typescript', 'java', 'c++', 'c', 'c#',
        'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'r', 'scala',
        'perl', 'haskell', 'lua', 'dart', 'julia', 'elixir'
    ]

    const SAMPLE_PROBLEMS = [
        'Kadane Algorithm for maximum subarray',
        'Binary search in sorted array',
        'Two Sum problem',
        'BFS traversal of a graph',
        'Dynamic programming knapsack',
        'Merge sort implementation',
        'Linked list operations',
        'Binary tree traversal'
    ]


    const generateCode = async () => {
        if (!problemStatement.trim()) {
            setError('Please enter a problem statement')
            return
        }

        setError('')
        setLoading(true)
        setShowResult(false)

        try {
            const response = await fetch(`${API_BASE_URL}/api/generate-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({
                    problem_statement: problemStatement,
                    language: language,
                    iteration: 0
                })
            })

            const data = await response.json()

            if (data.success) {
                setGeneratedCode(data)

                // Auto-analyze complexity
                await analyzeComplexity(data.code, data.language)

                setTimeout(() => setShowResult(true), 300)
            } else {
                setError(data.error || 'Code generation failed')
            }
        } catch (err) {
            console.error(err)
            setError(`Connection error. Ensure backend is running at ${API_BASE_URL}`)
        } finally {
            setLoading(false)
        }
    }

    const analyzeComplexity = async (code, lang) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/analyze-complexity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({
                    code: code,
                    language: lang,
                    problem_statement: problemStatement
                })
            })

            const data = await response.json()
            if (data.success) {
                setComplexity(data)
            }
        } catch (err) {
            console.error('Complexity analysis error:', err)
        }
    }

    const reset = () => {
        setProblemStatement('')
        setGeneratedCode(null)
        setComplexity(null)
        setError('')
        setShowResult(false)
    }

    const useSample = (sample) => {
        setProblemStatement(sample)
    }

    const copyCode = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode.code)
            alert('Code copied to clipboard!')
        }
    }

    return (
        <div className="problem-solver">
            {/* Header */}
            <div className="header">
                <h1 className="title">
                    <span className="icon">🤖</span>
                    AI Problem Solver
                </h1>
                <p className="subtitle">Generate complete, production-quality code instantly</p>
            </div>

            {/* Main Content */}
            <div className="content">
                {!showResult ? (
                    <div className="input-section">
                        <div className="card glass-card">
                            <div className="card-header">
                                <h2>📝 Describe Your Problem</h2>
                            </div>

                            <div className="form-group">
                                <label>Problem Statement</label>
                                <textarea
                                    value={problemStatement}
                                    onChange={(e) => setProblemStatement(e.target.value)}
                                    placeholder="Example: Write a function to reverse a linked list"
                                    rows={6}
                                    disabled={loading}
                                    className="input-textarea"
                                />
                            </div>

                            {/* Sample Problems */}
                            <div className="samples">
                                <span className="samples-label">Quick examples:</span>
                                {SAMPLE_PROBLEMS.map((sample, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => useSample(sample)}
                                        className="sample-btn"
                                        disabled={loading}
                                    >
                                        {sample}
                                    </button>
                                ))}
                            </div>

                            <div className="form-group">
                                <label>Programming Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    disabled={loading}
                                    className="input-select"
                                >
                                    {LANGUAGES.map(lang => (
                                        <option key={lang} value={lang}>
                                            {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <div className="error-message">
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                onClick={generateCode}
                                disabled={!problemStatement || loading}
                                className={`generate-btn ${loading ? 'loading' : ''}`}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Generating Complete Code...
                                    </>
                                ) : (
                                    <>
                                        ✨ Generate Solution
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="results-section">
                        {/* Generated Code */}
                        <div className="card glass-card result-card">
                            <div className="card-header">
                                <h2>💡 Generated Solution</h2>
                                <div className="header-actions">
                                    <span className="language-badge">{generatedCode.language}</span>
                                    <button onClick={copyCode} className="copy-btn">
                                        📋 Copy
                                    </button>
                                    <button onClick={() => setShowVisualizer(true)} className="visualize-btn">
                                        🎬 Visualize
                                    </button>
                                    <button onClick={reset} className="reset-btn">
                                        🔄 New Problem
                                    </button>
                                </div>
                            </div>

                            <div className="code-container">
                                <pre className="code-block">
                                    <code>{generatedCode.code}</code>
                                </pre>
                            </div>

                            {showVisualizer && (
                                <AlgorithmVisualizer
                                    code={generatedCode.code}
                                    language={generatedCode.language}
                                    onClose={() => setShowVisualizer(false)}
                                />
                            )}


                            <div className="metadata">
                                <div className="meta-item">
                                    <span className="meta-label">Provider:</span>
                                    <span className="meta-value">{generatedCode.provider}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Generated:</span>
                                    <span className="meta-value">
                                        {new Date(generatedCode.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Size:</span>
                                    <span className="meta-value">{generatedCode.code.length} chars</span>
                                </div>
                            </div>
                        </div>


                        {/* Explanation & Audio Section */}
                        <div className="card glass-card result-card">
                            <div className="card-header">
                                <h2>🎓 Explanation & Audio</h2>
                                <div className="header-actions">
                                    <button
                                        onClick={getExplanation}
                                        disabled={loadingExplanation}
                                        className="visualize-btn"
                                        style={{ background: '#4facfe' }}
                                    >
                                        {loadingExplanation ? 'Analyzing...' : '📖 Text Explain'}
                                    </button>
                                    <button
                                        onClick={getAudio}
                                        disabled={loadingAudio}
                                        className="visualize-btn"
                                        style={{ background: '#ff9a9e' }}
                                    >
                                        {loadingAudio ? 'Generating...' : '🎧 Audio Walkthrough'}
                                    </button>
                                </div>
                            </div>

                            {/* Text Explanation Display */}
                            {explanation && (
                                <div className="explanation-content" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                    <h3>Detailed Analysis</h3>
                                    <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui', lineHeight: '1.6' }}>
                                        {explanation}
                                    </div>
                                </div>
                            )}

                            {/* Audio Player */}
                            {audioUrl && (
                                <div className="audio-player" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                                    <h3>🎧 Audio Walkthrough</h3>
                                    <audio controls src={`${API_BASE_URL}${audioUrl}`} style={{ width: '100%', marginTop: '0.5rem' }} />
                                    {audioScript && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#ccc', fontStyle: 'italic' }}>
                                            "{audioScript}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Complexity Analysis */}
                        {complexity && (
                            <div className="card glass-card">
                                <div className="card-header">
                                    <h2>📊 Complexity Analysis</h2>
                                </div>

                                <div className="complexity-grid">
                                    <div className="complexity-item time">
                                        <div className="complexity-label">Time Complexity</div>
                                        <div className="complexity-value">{complexity.complexity.time}</div>
                                    </div>
                                    <div className="complexity-item space">
                                        <div className="complexity-label">Space Complexity</div>
                                        <div className="complexity-value">{complexity.complexity.space}</div>
                                    </div>
                                </div>

                                {complexity.optimization_suggestions?.length > 0 && (
                                    <div className="suggestions">
                                        <h3>💡 Optimization Suggestions:</h3>
                                        <ul>
                                            {complexity.optimization_suggestions.map((suggestion, idx) => (
                                                <li key={idx}>{suggestion}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="footer">
                <p>Powered by Enhanced Code Generator v2.0 • Complete Solutions, No Skeleton Code</p>
            </div>
        </div>
    )
}

export default ProblemSolver
