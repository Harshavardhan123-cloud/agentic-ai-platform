import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './ProblemSolver.css'; // Reuse existing styles for consistency

const Login = () => {
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
        <div className="app-container">
            <header className="app-header">
                <div className="logo-container">
                    <span className="logo-icon">🔐</span>
                    <h1>HRC AI Login</h1>
                </div>
            </header>

            <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="solver-card" style={{ maxWidth: '400px', width: '100%' }}>
                    <div className="card-header">
                        <h2>Welcome Back</h2>
                        <p>Please sign in to access the platform</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {error && (
                            <div className="error-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4444', background: 'rgba(255, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                                <span>⚠️</span>
                                {error}
                            </div>
                        )}

                        <div className="input-group">
                            <label style={{ color: '#a0a0b0', marginBottom: '0.5rem', display: 'block' }}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="problem-input"
                                placeholder="Enter username"
                                style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '8px' }}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ color: '#a0a0b0', marginBottom: '0.5rem', display: 'block' }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="problem-input"
                                placeholder="Enter password"
                                style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '8px' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="generate-btn"
                            style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <span>🚀</span> Sign In
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '1rem', color: '#ccc' }}>
                            Need an account? <span onClick={onSwitchToSignup} style={{ color: '#4facfe', cursor: 'pointer', textDecoration: 'underline' }}>Sign Up</span>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Login;
