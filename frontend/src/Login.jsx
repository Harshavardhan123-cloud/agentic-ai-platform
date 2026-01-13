import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './Auth.css';

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
        <div className="auth-container">
            {/* Left Side - AI Hero Section */}
            <div className="auth-hero">
                {/* Animated Background Elements */}
                <div className="auth-orb-1" />
                <div className="auth-orb-2" />

                {/* Content */}
                <div className="hero-content">
                    <div className="hero-title">
                        Agentic AI <br /> Platform
                    </div>
                    <p className="hero-description">
                        Experience the future of coding with our multi-agent autonomous system.
                        Generate, analyze, and optimize code in real-time.
                    </p>
                    <div className="feature-badges">
                        <div className="feature-badge">✨ Code Generation</div>
                        <div className="feature-badge">🚀 Complexity Analysis</div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="auth-form-container">
                {/* Decorative Grid/Lines */}
                <div className="grid-overlay" />

                <div className="auth-card">
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
                            <label className="auth-label">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                className="auth-input"
                            />
                        </div>

                        <div>
                            <label className="auth-label">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="auth-input"
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
