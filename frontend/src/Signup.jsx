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
        { id: 'special', label: 'Special character (!@#$%^&*)', test: (p) => /[^a-zA-Z0-9]/.test(p) }
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

        // No manual card validation needed - Razorpay handles payment after signup

        const { confirmPassword, paymentDetails, ...submitData } = formData;

        const result = await register(submitData);

        if (result.success) {
            // If paid plan, trigger Razorpay checkout after signup
            if (formData.subscription_plan !== 'free') {
                setSuccess("Account created! Opening payment...");

                try {
                    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://agentic-ai-platform-1-e7zu.onrender.com';

                    // Get auth token from the registration response or login
                    const token = result.token || localStorage.getItem('token');

                    // Create Razorpay order
                    const orderRes = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ plan: formData.subscription_plan })
                    });

                    const orderData = await orderRes.json();

                    if (orderData.order_id) {
                        // Load Razorpay script if not already loaded
                        if (!window.Razorpay) {
                            const script = document.createElement('script');
                            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                            document.body.appendChild(script);
                            await new Promise(resolve => script.onload = resolve);
                        }

                        // Open Razorpay checkout
                        const options = {
                            key: orderData.key_id,
                            amount: orderData.amount,
                            currency: orderData.currency,
                            name: 'HRC AI',
                            description: `${orderData.plan.name} Plan Subscription`,
                            order_id: orderData.order_id,
                            prefill: {
                                email: formData.email,
                                contact: formData.phone
                            },
                            theme: { color: '#8B5CF6' },
                            handler: async function (response) {
                                // Verify payment
                                const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
                                        plan: formData.subscription_plan
                                    })
                                });

                                const verifyData = await verifyRes.json();
                                if (verifyData.success) {
                                    setSuccess("Payment successful! Redirecting to login...");
                                    setTimeout(() => onSwitchToLogin(), 1500);
                                } else {
                                    setError("Payment verification failed. Please contact support.");
                                }
                            },
                            modal: {
                                ondismiss: function () {
                                    setSuccess("Account created! You can upgrade later from settings.");
                                    setTimeout(() => onSwitchToLogin(), 2000);
                                }
                            }
                        };

                        const rzp = new window.Razorpay(options);
                        rzp.open();
                    } else {
                        setError(orderData.error || "Failed to create payment order");
                        setTimeout(() => onSwitchToLogin(), 2000);
                    }
                } catch (paymentError) {
                    console.error('Payment error:', paymentError);
                    setSuccess("Account created! Payment setup failed - you can upgrade later.");
                    setTimeout(() => onSwitchToLogin(), 2000);
                }
            } else {
                setSuccess("Account created successfully! Redirecting...");
                setTimeout(() => {
                    onSwitchToLogin();
                }, 1500);
            }
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div
                            onClick={() => setFormData({ ...formData, subscription_plan: 'free' })}
                            style={{
                                padding: '16px 12px',
                                borderRadius: '12px',
                                border: formData.subscription_plan === 'free' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                background: formData.subscription_plan === 'free' ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Free</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₹0/mo</div>
                        </div>
                        <div
                            onClick={() => setFormData({ ...formData, subscription_plan: 'pro' })}
                            style={{
                                padding: '16px 12px',
                                borderRadius: '12px',
                                border: formData.subscription_plan === 'pro' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                background: formData.subscription_plan === 'pro' ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Pro 👑</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₹499/mo</div>
                        </div>
                        <div
                            onClick={() => setFormData({ ...formData, subscription_plan: 'enterprise' })}
                            style={{
                                padding: '16px 12px',
                                borderRadius: '12px',
                                border: formData.subscription_plan === 'enterprise' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                background: formData.subscription_plan === 'enterprise' ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-secondary)',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Enterprise 🚀</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₹1999/mo</div>
                        </div>
                    </div>

                    {/* Payment Info (Only for Paid Plans) */}
                    {formData.subscription_plan !== 'free' && (
                        <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '1.2rem' }}>💳</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Razorpay Checkout</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                Secure payment via UPI, Cards, Netbanking, or Wallets. You'll be redirected to Razorpay after signup.
                            </p>
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
