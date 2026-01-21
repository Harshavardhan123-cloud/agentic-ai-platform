import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Logo from './Logo';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

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

    // Social login handlers - redirect to OAuth providers
    const handleGoogleLogin = () => {
        // Google OAuth URL - Replace CLIENT_ID with your actual Google OAuth Client ID
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + '/oauth/callback');
        const scope = encodeURIComponent('email profile');
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline`;
        window.location.href = googleAuthUrl;
    };

    const handleGitHubLogin = () => {
        // GitHub OAuth URL - Replace CLIENT_ID with your actual GitHub OAuth App Client ID
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'YOUR_GITHUB_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + '/oauth/callback');
        const scope = encodeURIComponent('user:email');
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
        window.location.href = githubAuthUrl;
    };

    const handleLinkedInLogin = () => {
        // LinkedIn OAuth URL - Replace CLIENT_ID with your actual LinkedIn OAuth App Client ID
        const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || 'YOUR_LINKEDIN_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + '/oauth/callback');
        const scope = encodeURIComponent('r_liteprofile r_emailaddress');
        const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
        window.location.href = linkedinAuthUrl;
    };

    // Social button styles
    const socialBtnStyle = {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        background: 'rgba(255,255,255,0.03)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 500,
        transition: 'all 0.2s ease'
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', backgroundColor: 'var(--bg-app)' }}>
            <div className="content-card" style={{ maxWidth: '420px', width: '100%', padding: '40px' }}>
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

                    {/* Divider with "OR" */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '8px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 500 }}>OR CONTINUE WITH</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
                    </div>

                    {/* Social Login Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            style={{ ...socialBtnStyle }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ea4335'; e.currentTarget.style.background = 'rgba(234, 67, 53, 0.1)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                            <GoogleIcon style={{ color: '#ea4335', fontSize: '20px' }} />
                        </button>
                        <button
                            type="button"
                            onClick={handleGitHubLogin}
                            style={{ ...socialBtnStyle }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ffffff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                            <GitHubIcon style={{ color: '#ffffff', fontSize: '20px' }} />
                        </button>
                        <button
                            type="button"
                            onClick={handleLinkedInLogin}
                            style={{ ...socialBtnStyle }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#0a66c2'; e.currentTarget.style.background = 'rgba(10, 102, 194, 0.1)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                            <LinkedInIcon style={{ color: '#0a66c2', fontSize: '20px' }} />
                        </button>
                    </div>

                    <div className="separator" style={{ margin: '16px 0' }}></div>

                    <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Don't have an account? <span onClick={onSwitchToSignup} style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '500' }}>Create Account</span>
                    </div>
                </form>

                {/* Demo Credentials Hint */}
                <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
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

