import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import './ProblemSolver.css';

const Signup = ({ onSwitchToLogin }) => {
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
        <div className="app-container">
            <header className="app-header">
                <div className="logo-container">
                    <span className="logo-icon">✨</span>
                    <h1>Create HRC AI Account</h1>
                </div>
            </header>

            <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
                <div className="solver-card" style={{ maxWidth: '500px', width: '100%' }}>
                    <div className="card-header">
                        <h2>Join Us</h2>
                        <p>Fill in your details</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
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
                            <label className="input-label">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="problem-input input-field"
                                placeholder="Enter full name"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="problem-input input-field"
                                placeholder="10-digit mobile number"
                                maxLength="10"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Country</label>
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="problem-input input-field input-select"
                                required
                            >
                                <option value="">Select Country</option>
                                <option value="India">India</option>
                                <option value="USA">USA</option>
                                <option value="UK">UK</option>
                                <option value="Canada">Canada</option>
                                <option value="Australia">Australia</option>
                                <option value="Germany">Germany</option>
                                <option value="France">France</option>
                                <option value="Japan">Japan</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="problem-input input-field"
                                placeholder="Choose a username"
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label className="input-label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="problem-input input-field"
                                    placeholder="Password"
                                    required
                                />
                            </div>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label className="input-label">Confirm</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="problem-input input-field"
                                    placeholder="Confirm"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="generate-btn"
                            style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <span>🚀</span> Create Account
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
