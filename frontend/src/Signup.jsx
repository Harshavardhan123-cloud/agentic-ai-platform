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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', backgroundColor: 'var(--bg-app)' }}>
            <div className="content-card" style={{ maxWidth: '500px', width: '100%', padding: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div className="icon-box" style={{ margin: '0 auto 16px', display: 'inline-flex', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                        <HowToRegIcon style={{ fontSize: '32px', color: 'var(--accent-primary)' }} />
                    </div>
                    <h2 className="h2" style={{ marginBottom: '8px' }}>Create Account</h2>
                    <p className="text-light">Join the Agentic AI Platform</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && (
                        <div style={{ padding: '12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ padding: '12px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                            <span>✅</span> {success}
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                            <BadgeIcon fontSize="small" />
                        </div>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="form-input" style={{ paddingLeft: '40px' }} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                                <PhoneIcon fontSize="small" />
                            </div>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" maxLength="10" className="form-input" style={{ paddingLeft: '40px' }} required />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                                <PublicIcon fontSize="small" />
                            </div>
                            <select name="country" value={formData.country} onChange={handleChange} className="form-input" style={{ paddingLeft: '40px', appearance: 'none', cursor: 'pointer' }} required>
                                <option value="" style={{ color: 'var(--text-tertiary)' }}>Select Country</option>
                                <option value="India" style={{ color: 'var(--text-primary)' }}>India</option>
                                <option value="USA" style={{ color: 'var(--text-primary)' }}>USA</option>
                                <option value="UK" style={{ color: 'var(--text-primary)' }}>UK</option>
                                <option value="Canada" style={{ color: 'var(--text-primary)' }}>Canada</option>
                                <option value="Australia" style={{ color: 'var(--text-primary)' }}>Australia</option>
                                <option value="Germany" style={{ color: 'var(--text-primary)' }}>Germany</option>
                                <option value="France" style={{ color: 'var(--text-primary)' }}>France</option>
                                <option value="Japan" style={{ color: 'var(--text-primary)' }}>Japan</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                            <PersonIcon fontSize="small" />
                        </div>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="form-input" style={{ paddingLeft: '40px' }} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                                <LockIcon fontSize="small" />
                            </div>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="form-input" style={{ paddingLeft: '40px' }} required />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '10px', left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                                <LockIcon fontSize="small" />
                            </div>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm" className="form-input" style={{ paddingLeft: '40px' }} required />
                        </div>
                    </div>

                    <button type="submit" className="form-btn">
                        <span>Create Account</span>
                    </button>

                    <div className="separator" style={{ margin: '24px 0' }}></div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <span onClick={onSwitchToHome} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.8, transition: '0.2s' }}>
                            <ArrowBackIcon fontSize="small" /> Back to Home
                        </span>
                        <span>
                            Already a member? <span onClick={onSwitchToLogin} style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '500' }}>Login</span>
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
