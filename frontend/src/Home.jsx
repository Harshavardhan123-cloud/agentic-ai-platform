import React, { useState, useEffect } from 'react';
import './Home.css';

const Home = ({ onStart }) => {
    const [serverStatus, setServerStatus] = useState('checking');
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://agentic-ai-platform-1-e7zu.onrender.com';

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/health`);
                if (res.ok) setServerStatus('online');
                else setServerStatus('offline');
            } catch (e) {
                setServerStatus('offline');
            }
        };
        checkHealth();
    }, [API_BASE_URL]);

    return (
        <div className="home-container">
            <header className="home-hero">
                <h1>HRC AI</h1>
                <p className="subtitle">Automatic Code Generation and Analysis</p>

                <div className="status-badge">
                    <span className={`status-dot ${serverStatus}`}></span>
                    Backend Status: {serverStatus.toUpperCase()}
                    {serverStatus === 'offline' && <span className="status-hint"> (Render free tier may take 50s to wake up)</span>}
                </div>

                <div className="cta-group">
                    <button className="cta-primary" onClick={() => onStart('problem-solver')}>
                        🚀 Login to Start
                    </button>
                    <button className="cta-secondary" onClick={() => onStart('dashboard')}>
                        📊 View Dashboard
                    </button>
                </div>
            </header>

            <section className="features-grid">
                <div className="feature-card">
                    <h3>🤖 AI Agents</h3>
                    <p>Collaborative agents for coding, reviewing, and testing logic.</p>
                </div>
                <div className="feature-card">
                    <h3>🎨 Visualizer</h3>
                    <p>Step-by-step universal visualization for ANY algorithm.</p>
                </div>
                <div className="feature-card">
                    <h3>⚡ Real-time</h3>
                    <p>Live metrics and complex analysis powered by LLMs.</p>
                </div>
            </section>
        </div>
    );
};

export default Home;
