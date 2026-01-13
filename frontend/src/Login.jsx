import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './ProblemSolver.css';

const Login = ({ onSwitchToSignup }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(username, password);
        if (!result.success) {
            setError(result.error);
        }
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            background: '#0f0c29'
        }}>
            {/* Left Side - AI Hero Section */}
            <div style={{
                flex: '1.5',
                position: 'relative',
                background: 'linear-gradient(135deg, #24243e 0%, #302b63 50%, #0f0c29 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                padding: '4rem',
                overflow: 'hidden'
            }}>
                {/* Animated Background Elements */}
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(118,75,162,0.4) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                    animation: 'float 6s ease-in-out infinite'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '-5%',
                    width: '300px',
                    height: '300px',
                    background: 'radial-gradient(circle, rgba(100,125,238,0.3) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(50px)',
                    animation: 'float 8s ease-in-out infinite reverse'
                }} />

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 10, maxWidth: '600px' }}>
                    <div style={{
                        fontSize: '4rem',
                        fontWeight: '800',
                        marginBottom: '1.5rem',
                        lineHeight: '1.1',
                        background: 'linear-gradient(45deg, #fff 30%, #a2a2d0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Agentic AI <br /> Platform
                    </div>
                    <p style={{
                        fontSize: '1.25rem',
                        lineHeight: '1.6',
                        color: 'rgba(255,255,255,0.8)',
                        marginBottom: '2rem'
                    }}>
                        Experience the future of coding with our multi-agent autonomous system.
                        Generate, analyze, and optimize code in real-time.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            ✨ Code Generation
                        </div>
                        <div style={{ padding: '0.8rem 1.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            🚀 Complexity Analysis
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div style={{
                flex: '1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'rgba(15, 12, 41, 0.95)',
                position: 'relative'
            }}>
                {/* Decorative Grid/Lines */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                    pointerEvents: 'none'
                }} />

                <div style={{
                    width: '100%',
                    maxWidth: '420px',
                    padding: '2rem',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Welcome Back</h2>
                        <p style={{ color: '#8b8b9e' }}>Please sign in to your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {error && (
                            <div style={{
                                padding: '12px',
                                borderRadius: '8px',
                                background: 'rgba(255, 68, 68, 0.15)',
                                border: '1px solid rgba(255, 68, 68, 0.3)',
                                color: '#ff6b6b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.3s'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#ccc', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.3s'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="generate-btn"
                            style={{
                                marginTop: '1rem',
                                background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                                border: 'none',
                                padding: '16px',
                                fontSize: '1.1rem',
                                borderRadius: '10px'
                            }}
                        >
                            Sign In
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#888' }}>
                            New to HRC AI? <span onClick={onSwitchToSignup} style={{ color: '#4facfe', cursor: 'pointer', fontWeight: '600' }}>Create an account</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
