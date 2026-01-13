import React, { useState } from 'react';
import { useAuth } from './AuthContext';
// import './Auth.css'; // Removed in favor of global theme
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="icon-box" style={{ margin: '0 auto 15px', width: '60px', height: '60px' }}>
                        <AutoAwesomeIcon style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }} />
                    </div>
                    <h2 className="h2" style={{ fontSize: '24px' }}>Welcome Back</h2>
                    <p className="text-light">Sign in to your dashboard</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'rgba(255, 68, 68, 0.1)',
                            border: '1px solid rgba(255, 68, 68, 0.2)',
                            color: '#ff6b6b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '14px'
                        }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '14px', left: '15px', color: 'var(--light-gray-70)' }}>
                            <PersonIcon fontSize="small" />
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            className="form-input"
                            style={{ paddingLeft: '45px' }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '14px', left: '15px', color: 'var(--light-gray-70)' }}>
                            <LockIcon fontSize="small" />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="form-input"
                            style={{ paddingLeft: '45px' }}
                        />
                    </div>

                    <button type="submit" className="form-btn">
                        <LoginIcon fontSize="small" />
                        <span>Sign In</span>
                    </button>

                    <div className="separator"></div>

                    <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--light-gray)' }}>
                        New platform user? <span onClick={onSwitchToSignup} style={{ color: 'var(--orange-yellow-crayola)', cursor: 'pointer', fontWeight: '500', display: 'inline' }}>Create Account</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
