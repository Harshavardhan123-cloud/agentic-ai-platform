import React, { useState } from 'react';
import { useAuth } from './AuthContext';
// import './Auth.css'; // Removed in favor of global theme
import Logo from './Logo';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', backgroundColor: 'var(--bg-app)' }}>
            <div className="content-card" style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <Logo size="large" />
                    </div>
                    <h2 className="h2" style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Welcome Back</h2>
                    <p className="text-light" style={{ textAlign: 'center' }}>Sign in to your dashboard</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#fca5a5',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.9rem'
                        }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                            <PersonIcon fontSize="small" />
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            className="form-input"
                            style={{ paddingLeft: '48px' }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                            <LockIcon fontSize="small" />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="form-input"
                            style={{ paddingLeft: '48px' }}
                        />
                    </div>

                    <button type="submit" className="form-btn">
                        <span>Sign In</span>
                        <LoginIcon fontSize="small" />
                    </button>

                    <div className="separator" style={{ margin: '24px 0' }}></div>

                    <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Don't have an account? <span onClick={onSwitchToSignup} style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '500' }}>Create Account</span>
                    </div>
                </form>

                {/* Demo Credentials Hint */}
                <div style={{ marginTop: '32px', padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                        Demo Credentials
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                        <span>user: <strong style={{ color: 'var(--text-primary)' }}>admin</strong></span>
                        <span>pass: <strong style={{ color: 'var(--text-primary)' }}>admin</strong></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
