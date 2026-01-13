import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './ProblemSolver.css';

const Signup = ({ onSwitchToLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const result = await register(username, password);

        if (result.success) {
            setSuccess("Account created! Redirecting to login...");
            setTimeout(() => {
                onSwitchToLogin();
            }, 1500);
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="logo-container">
                    <span className="logo-icon">✨</span>
                    <h1>Create Account</h1>
                </div>
            </header>

            <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="solver-card" style={{ maxWidth: '400px', width: '100%' }}>
                    <div className="card-header">
                        <h2>Join HRC AI</h2>
                        <p>Sign up to start generating code</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {error && (
                            <div className="error-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4444', background: 'rgba(255, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                                <span>⚠️</span>
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="success-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#44ff44', background: 'rgba(68, 255, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                                <span>✅</span>
                                {success}
                            </div>
                        )}

                        <div className="input-group">
                            <label style={{ color: '#ffffff', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold' }}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="problem-input"
                                placeholder="Choose a username"
                                style={{ width: '100%', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.3)', color: 'white', borderRadius: '8px' }}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ color: '#ffffff', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold' }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="problem-input"
                                placeholder="Choose a password"
                                style={{ width: '100%', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.3)', color: 'white', borderRadius: '8px' }}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ color: '#ffffff', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold' }}>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="problem-input"
                                placeholder="Confirm password"
                                style={{ width: '100%', padding: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.3)', color: 'white', borderRadius: '8px' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="generate-btn"
                            style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <span>🚀</span> Sign Up
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '1rem', color: '#ccc' }}>
                            Already have an account? <span onClick={onSwitchToLogin} style={{ color: '#4facfe', cursor: 'pointer', textDecoration: 'underline' }}>Login</span>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Signup;
