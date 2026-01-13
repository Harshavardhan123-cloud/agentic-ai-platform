import React, { useState } from 'react'
import AlgorithmVisualizer from './AlgorithmVisualizer'
import { useAuth } from './AuthContext'
import Logo from './Logo'
import UserAvatar from './UserAvatar'
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

    // const { getAuthHeader } = useAuth() // Refactored below

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

    const { user, getAuthHeader, logout } = useAuth() // Added user and logout

    // ... existing code ...

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{user?.username || 'Guest'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', cursor: 'pointer' }} onClick={logout}>Sign Out</div>
                    </div>
                    <UserAvatar username={user?.username || 'G'} size="medium" />
                </div>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', textAlign: 'center' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Logo size="large" />
                </div>
                <h1 className="h2" style={{ fontSize: '2rem' }}>
                    AI Problem Solver
                </h1>
                <p className="text-light" style={{ marginTop: '8px' }}>Generate complete, production-quality code instantly</p>
            </div>

            {/* Main Content */}
            <div>
                {!showResult ? (
                    <div className="content-card">
                        <div style={{ marginBottom: '24px' }}>
                            <h2 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <DescriptionIcon /> Describe Your Problem
                            </h2>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label className="text-light" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Problem Statement</label>
                            <textarea
                                value={problemStatement}
                                onChange={(e) => setProblemStatement(e.target.value)}
                                placeholder="Example: Write a function to reverse a linked list"
                                rows={6}
                                disabled={loading}
                                className="form-input"
                                style={{ minHeight: '150px', resize: 'vertical' }}
                            />
                        </div>

                        {/* Sample Problems */}
                        <div style={{ marginBottom: '24px' }}>
                            <span className="text-light" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '12px' }}>Quick examples:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {SAMPLE_PROBLEMS.map((sample, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => useSample(sample)}
                                        disabled={loading}
                                        className="form-btn secondary"
                                        style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 400 }}
                                    >
                                        {sample}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label className="text-light" style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Programming Language</label>
                            <div style={{ position: 'relative' }}>
                                <CodeIcon style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-tertiary)', zIndex: 2 }} fontSize="small" />
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    disabled={loading}
                                    className="form-input"
                                    style={{ paddingLeft: '40px', appearance: 'none', cursor: 'pointer' }}
                                >
                                    {LANGUAGES.map(lang => (
                                        <option key={lang} value={lang} style={{ color: 'black' }}>
                                            {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div style={{ marginBottom: '20px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            onClick={generateCode}
                            disabled={!problemStatement || loading}
                            className="form-btn"
                            style={{ height: '48px', fontSize: '1rem' }}
                        >
                            {loading ? (
                                <>
                                    <RefreshIcon className="spin" />
                                    Generating Solution...
                                </>
                            ) : (
                                <>
                                    <AutoAwesomeIcon /> Generate Solution
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Generated Code */}
                        <div className="content-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                                <h2 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <CodeIcon /> Generated Solution
                                </h2>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.75rem', alignSelf: 'center', marginRight: '8px' }}>{generatedCode.language}</span>
                                    <button onClick={copyCode} title="Copy Code" className="form-btn secondary" style={{ width: '36px', padding: 0 }}>
                                        <ContentCopyIcon fontSize="small" />
                                    </button>
                                    <button onClick={() => setShowVisualizer(true)} title="Visualize" className="form-btn secondary" style={{ width: '36px', padding: 0 }}>
                                        <PlayArrowIcon fontSize="small" />
                                    </button>
                                    <button onClick={reset} title="New Problem" className="form-btn secondary" style={{ width: '36px', padding: 0 }}>
                                        <RefreshIcon fontSize="small" />
                                    </button>
                                </div>
                            </div>

                            <div style={{ background: '#09090b', borderRadius: '8px', padding: '20px', overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>
                                <pre style={{ margin: 0, fontFamily: 'monospace', color: '#e5e7eb', fontSize: '0.9rem' }}>
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

                            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                <span>Provider: {generatedCode.provider}</span>
                                <span>Size: {generatedCode.code.length} chars</span>
                            </div>
                        </div>


                        {/* Explanation & Audio Section */}
                        <div className="content-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <DescriptionIcon /> Explanation & Audio
                                </h2>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={getExplanation}
                                        disabled={loadingExplanation}
                                        className="form-btn secondary"
                                        style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
                                    >
                                        {loadingExplanation ? 'Analyzing...' : '📖 Text Explain'}
                                    </button>
                                    <button
                                        onClick={getAudio}
                                        disabled={loadingAudio}
                                        className="form-btn secondary"
                                        style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
                                    >
                                        {loadingAudio ? 'Generating...' : '🎧 Audio Walkthrough'}
                                    </button>
                                </div>
                            </div>

                            {/* Text Explanation Display */}
                            {explanation && (
                                <div style={{ marginTop: '1rem', padding: '20px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                    <h3 className="h4" style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1rem', fontWeight: 600 }}>Detailed Analysis</h3>
                                    <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', lineHeight: '1.6', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                        {explanation}
                                    </div>
                                </div>
                            )}

                            {/* Audio Player */}
                            {audioUrl && (
                                <div style={{ marginTop: '1rem', padding: '20px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                    <h3 className="h4" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem' }}>
                                        <HeadphonesIcon style={{ color: 'var(--accent-primary)' }} /> Audio Walkthrough
                                    </h3>
                                    <audio controls src={`${API_BASE_URL}${audioUrl}`} style={{ width: '100%', marginTop: '0.5rem', height: '40px' }} />
                                    {audioScript && (
                                        <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                            "{audioScript}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Complexity Analysis */}
                        {complexity && (
                            <div className="content-card">
                                <div style={{ marginBottom: '24px' }}>
                                    <h2 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <AssessmentIcon /> Complexity Analysis
                                    </h2>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                    <div style={{ background: 'var(--bg-app)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Time Complexity</div>
                                        <div style={{ color: 'var(--accent-primary)', fontSize: '1.25rem', fontWeight: '600' }}>{complexity.complexity.time}</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-app)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Space Complexity</div>
                                        <div style={{ color: 'var(--accent-primary)', fontSize: '1.25rem', fontWeight: '600' }}>{complexity.complexity.space}</div>
                                    </div>
                                </div>

                                {complexity.optimization_suggestions?.length > 0 && (
                                    <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                        <h3 className="h4" style={{ marginBottom: '12px', color: 'var(--text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                                            Optimization Suggestions
                                        </h3>
                                        <ul style={{ listStyle: 'none', paddingLeft: '14px', color: 'var(--text-secondary)' }}>
                                            {complexity.optimization_suggestions.map((suggestion, idx) => (
                                                <li key={idx} style={{ marginBottom: '8px', position: 'relative' }}>
                                                    <span style={{ position: 'absolute', left: '-14px', top: '8px', width: '4px', height: '1px', background: 'var(--text-tertiary)' }}></span>
                                                    {suggestion}
                                                </li>
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
            <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                <p>Powered by Enhanced Code Generator v2.0 • Complete Solutions, No Skeleton Code</p>
            </div>
        </div>
    )
}

export default ProblemSolver
