import React, { useState } from 'react';
import { useAuth } from './AuthContext';
// import './Auth.css'; // Removed
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIcon from '@mui/icons-material/Phone';
import PublicIcon from '@mui/icons-material/Public';
import BadgeIcon from '@mui/icons-material/Badge';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const Signup = ({ onSwitchToLogin, onSwitchToHome }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        country: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { register } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.phone.length !== 10 || isNaN(formData.phone)) {
            setError("Phone number must be exactly 10 digits");
            return;
        }

        if (!formData.country) {
            setError("Please select a country");
            return;
        }

        const { confirmPassword, ...submitData } = formData;

        const result = await register(submitData);

        if (result.success) {
            setSuccess("Account created successfully! Redirecting...");
            setTimeout(() => {
                onSwitchToLogin();
            }, 1500);
        } else {
            setError(result.error);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
            <div className="glass-card" style={{ maxWidth: '500px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="icon-box" style={{ margin: '0 auto 15px', width: '60px', height: '60px' }}>
                        <HowToRegIcon style={{ fontSize: '32px', color: 'var(--orange-yellow-crayola)' }} />
                    </div>
                    <h2 className="h2" style={{ fontSize: '24px' }}>Create Account</h2>
                    <p className="text-light">Join the Agentic AI Platform</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {error && (
                        <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(68, 255, 68, 0.1)', border: '1px solid rgba(68, 255, 68, 0.2)', color: '#51ff51', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                            <span>✅</span> {success}
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '14px', left: '15px', color: 'var(--light-gray-70)' }}>
                            <BadgeIcon fontSize="small" />
                        </div>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="form-input" style={{ paddingLeft: '45px' }} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '14px', left: '15px', color: 'var(--light-gray-70)' }}>
                                <PhoneIcon fontSize="small" />
                            </div>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone (10 digits)" maxLength="10" className="form-input" style={{ paddingLeft: '45px' }} required />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '14px', left: '15px', color: 'var(--light-gray-70)' }}>
                                <PublicIcon fontSize="small" />
                            </div>
                            <select name="country" value={formData.country} onChange={handleChange} className="form-input" style={{ paddingLeft: '45px', appearance: 'none', cursor: 'pointer' }} required>
                                <option value="" style={{ color: 'black' }}>Select Country</option>
                                <option value="India" style={{ color: 'black' }}>India</option>
                                <option value="USA" style={{ color: 'black' }}>USA</option>
                                <option value="UK" style={{ color: 'black' }}>UK</option>
                                <option value="Canada" style={{ color: 'black' }}>Canada</option>
                                <option value="Australia" style={{ color: 'black' }}>Australia</option>
                                <option value="Germany" style={{ color: 'black' }}>Germany</option>
                                <option value="France" style={{ color: 'black' }}>France</option>
                                <option value="Japan" style={{ color: 'black' }}>Japan</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '14px', left: '15px', color: 'var(--light-gray-70)' }}>
                            <PersonIcon fontSize="small" />
                        </div>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="form-input" style={{ paddingLeft: '45px' }} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '14px', left: '15px', color: 'var(--light-gray-70)' }}>
                                <LockIcon fontSize="small" />
                            </div>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="form-input" style={{ paddingLeft: '45px' }} required />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '14px', left: '15px', color: 'var(--light-gray-70)' }}>
                                <LockIcon fontSize="small" />
                            </div>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm" className="form-input" style={{ paddingLeft: '45px' }} required />
                        </div>
                    </div>

                    <button type="submit" className="form-btn">
                        <span>Create Account</span>
                    </button>

                    <div className="separator"></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: 'var(--light-gray)' }}>
                        <span onClick={onSwitchToHome} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.8, transition: '0.2s' }}>
                            <ArrowBackIcon fontSize="small" /> Back to Home
                        </span>
                        <span>
                            Already a member? <span onClick={onSwitchToLogin} style={{ color: 'var(--orange-yellow-crayola)', cursor: 'pointer', fontWeight: '500' }}>Login</span>
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
name: '',
    phone: '',
        country: '',
            username: '',
                password: '',
                    confirmPassword: ''
    });
const [error, setError] = useState('');
const [success, setSuccess] = useState('');
const { register } = useAuth();

const handleChange = (e) => {
    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    });
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
    }

    if (formData.phone.length !== 10 || isNaN(formData.phone)) {
        setError("Phone number must be exactly 10 digits");
        return;
    }

    if (!formData.country) {
        setError("Please select a country");
        return;
    }

    const { confirmPassword, ...submitData } = formData;

    const result = await register(submitData);

    if (result.success) {
        setSuccess("Account created successfully! Redirecting...");
        setTimeout(() => {
            onSwitchToLogin();
        }, 1500);
    } else {
        setError(result.error);
    }
};

return (
    <div className="auth-container">
        {/* Left Side - AI Hero Section */}
        <div className="auth-hero">
            <div className="auth-orb-1" />
            <div className="auth-orb-2" />

            <div className="hero-content">
                <div className="hero-title">
                    Join the <br /> Revolution
                </div>
                <p className="hero-description">
                    Create your account to unlock the full power of our agentic coding platform.
                </p>
                <div className="feature-badges">
                    <div className="feature-badge">🚀 Instant Access</div>
                    <div className="feature-badge">🔒 Secure & Private</div>
                    <div className="feature-badge">⚡ Real-time Analysis</div>
                </div>
            </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="auth-form-container">
            <div className="grid-overlay" />

            <div className="auth-card" style={{ maxWidth: '480px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
                    <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 'bold', color: 'white' }}>
                        Create Account
                    </h2>
                    <p style={{ color: '#aaa', marginTop: '0.5rem' }}>Join HRC AI today</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {error && (
                        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 68, 68, 0.15)', border: '1px solid rgba(255, 68, 68, 0.3)', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(68, 255, 68, 0.15)', border: '1px solid rgba(68, 255, 68, 0.3)', color: '#51ff51', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>✅</span> {success}
                        </div>
                    )}

                    {/* Full Name */}
                    <div>
                        <label className="auth-label">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                            className="auth-input"
                        />
                    </div>

                    {/* Phone & Country Row */}
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label className="auth-label">Phone</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="10 digits"
                                maxLength="10"
                                required
                                className="auth-input"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="auth-label">Country</label>
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                required
                                className="auth-input"
                                style={{ cursor: 'pointer', appearance: 'none' }}
                            >
                                <option value="" style={{ color: 'black' }}>Select</option>
                                <option value="India" style={{ color: 'black' }}>India</option>
                                <option value="USA" style={{ color: 'black' }}>USA</option>
                                <option value="UK" style={{ color: 'black' }}>UK</option>
                                <option value="Canada" style={{ color: 'black' }}>Canada</option>
                                <option value="Australia" style={{ color: 'black' }}>Australia</option>
                                <option value="Germany" style={{ color: 'black' }}>Germany</option>
                                <option value="France" style={{ color: 'black' }}>France</option>
                                <option value="Japan" style={{ color: 'black' }}>Japan</option>
                            </select>
                        </div>
                    </div>

                    {/* Username */}
                    <div>
                        <label className="auth-label">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a unique username"
                            required
                            className="auth-input"
                        />
                    </div>

                    {/* Password Row */}
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label className="auth-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="auth-input"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="auth-label">Confirm</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="auth-input"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
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
                        Create Account
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#ccc' }}>
                        <span onClick={onSwitchToHome} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.8, transition: '0.2s' }}>
                            <span>←</span> Back to Home
                        </span>
                        <span>
                            Already member? <span onClick={onSwitchToLogin} style={{ color: '#4facfe', cursor: 'pointer', textDecoration: 'underline' }}>Login</span>
                        </span>
                    </div>
                </form>
            </div>
        </div>
    </div>
);
};

export default Signup;
