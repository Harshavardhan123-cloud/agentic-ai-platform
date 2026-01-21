import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import Logo from './Logo';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIcon from '@mui/icons-material/Phone';
import PublicIcon from '@mui/icons-material/Public';
import BadgeIcon from '@mui/icons-material/Badge';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const Signup = ({ onSwitchToLogin, onSwitchToHome }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        country: '',
        email: '',
        password: '',
        confirmPassword: '',
        subscription_plan: 'free',
        paymentDetails: {
            cardNumber: '',
            expiry: '',
            cvv: ''
        }
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { register } = useAuth();

    // Password validation rules
    const passwordRules = [
        { id: 'length', label: '8-20 characters', test: (p) => p.length >= 8 && p.length <= 20 },
        { id: 'uppercase', label: 'Uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
        { id: 'lowercase', label: 'Lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
        { id: 'number', label: 'Number (0-9)', test: (p) => /[0-9]/.test(p) },
        { id: 'special', label: 'Special character (!@#$%^&*)', test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(p) }
    ];

    const isPasswordValid = () => passwordRules.every(rule => rule.test(formData.password));

    const handleChange = (e) => {
        if (e.target.name.startsWith('payment.')) {
            const field = e.target.name.split('.')[1];
            setFormData({
                ...formData,
                paymentDetails: {
                    ...formData.paymentDetails,
                    [field]: e.target.value
                }
            });
        } else {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Password validation
        if (!isPasswordValid()) {
            setError("Password doesn't meet all requirements");
            return;
        }

        // Passwords match check
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

        // Payment Validation for Pro Plan
        if (formData.subscription_plan === 'pro') {
            if (!formData.paymentDetails.cardNumber || formData.paymentDetails.cardNumber.length < 13) {
                setError("Invalid card number");
                return;
            }
            if (!formData.paymentDetails.expiry || !formData.paymentDetails.cvv) {
                setError("Please complete payment details");
                return;
            }
        }

        const { confirmPassword, ...submitData } = formData;
        // If free plan, don't send payment details to keep it clean
        if (submitData.subscription_plan === 'free') {
            delete submitData.paymentDetails;
        }

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
            <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <Logo size="large" />
                    </div>
                    <h2 className="h2" style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Create Account</h2>
                    <p className="text-light" style={{ textAlign: 'center' }}>Join the aesthetics of intelligence</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && (
                        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#86efac', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                            <span>✅</span> {success}
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                            <BadgeIcon fontSize="small" />
                        </div>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="form-input" style={{ paddingLeft: '48px' }} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                                <PhoneIcon fontSize="small" />
                            </div>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" maxLength="10" className="form-input" style={{ paddingLeft: '48px' }} required />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                                <PublicIcon fontSize="small" />
                            </div>
                            <select name="country" value={formData.country} onChange={handleChange} className="form-input" style={{ paddingLeft: '48px', appearance: 'none', cursor: 'pointer' }} required>
                                <option value="" style={{ color: 'var(--text-tertiary)' }}>Select Country</option>
                                <option value="India" style={{ color: '#0b0c15' }}>India</option>
                                <option value="USA" style={{ color: '#0b0c15' }}>USA</option>
                                <option value="UK" style={{ color: '#0b0c15' }}>UK</option>
                                <option value="Canada" style={{ color: '#0b0c15' }}>Canada</option>
                                <option value="Australia" style={{ color: '#0b0c15' }}>Australia</option>
                                <option value="Germany" style={{ color: '#0b0c15' }}>Germany</option>
                                <option value="France" style={{ color: '#0b0c15' }}>France</option>
                                <option value="Japan" style={{ color: '#0b0c15' }}>Japan</option>
                            </select>
                        </div>
                    </div>

                    {/* Plan Selection */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div
                            onClick={() => setFormData({ ...formData, subscription_plan: 'free' })}
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                border: formData.subscription_plan === 'free' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                background: formData.subscription_plan === 'free' ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Free</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Standard Access</div>
                        </div>
                        <div
                            onClick={() => setFormData({ ...formData, subscription_plan: 'pro' })}
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                border: formData.subscription_plan === 'pro' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                background: formData.subscription_plan === 'pro' ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Pro 👑</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Access</div>
                        </div>
                    </div>

                    {/* Payment Form (Only for Pro) */}
                    {formData.subscription_plan === 'pro' && (
                        <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Secure Payment</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input
                                    type="text"
                                    name="payment.cardNumber"
                                    value={formData.paymentDetails.cardNumber}
                                    onChange={handleChange}
                                    placeholder="Card Number (0000 0000 0000 0000)"
                                    className="form-input"
                                    maxLength="19"
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <input
                                        type="text"
                                        name="payment.expiry"
                                        value={formData.paymentDetails.expiry}
                                        onChange={handleChange}
                                        placeholder="MM/YY"
                                        className="form-input"
                                        maxLength="5"
                                    />
                                    <input
                                        type="text"
                                        name="payment.cvv"
                                        value={formData.paymentDetails.cvv}
                                        onChange={handleChange}
                                        placeholder="CVV"
                                        className="form-input"
                                        maxLength="3"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                            <EmailIcon fontSize="small" />
                        </div>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="form-input" style={{ paddingLeft: '48px' }} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                                <LockIcon fontSize="small" />
                            </div>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="form-input" style={{ paddingLeft: '48px' }} required minLength="8" maxLength="20" />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '12px', left: '16px', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                                <LockIcon fontSize="small" />
                            </div>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm" className="form-input" style={{ paddingLeft: '48px' }} required />
                        </div>
                    </div>

                    {/* Password Requirements */}
                    {formData.password && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: 500 }}>Password Requirements</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                {passwordRules.map(rule => (
                                    <div key={rule.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.75rem',
                                        color: rule.test(formData.password) ? '#10b981' : 'var(--text-tertiary)'
                                    }}>
                                        {rule.test(formData.password) ?
                                            <CheckCircleIcon style={{ fontSize: '14px' }} /> :
                                            <CancelIcon style={{ fontSize: '14px', opacity: 0.5 }} />
                                        }
                                        {rule.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button type="submit" className="form-btn">
                        <span>Create Account</span>
                        <ArrowBackIcon style={{ transform: 'rotate(180deg)' }} fontSize="small" />
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
