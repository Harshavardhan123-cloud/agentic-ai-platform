import React, { useState } from 'react'
import Home from './Home'
import ProblemSolver from './ProblemSolver'
import Dashboard from './Dashboard'
import Login from './Login'
import Signup from './Signup'
import { AuthProvider, useAuth } from './AuthContext'
import './App.css'

// Inner component to access AuthContext
const AppContent = () => {
    // Default to 'home' so users see valid UI immediately
    const [activeTab, setActiveTab] = useState('home')
    const { user, loading, logout } = useAuth()

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#0f0c29',
                color: 'white'
            }}>
                Loading HRC AI...
            </div>
        )
    }

    // Helper to switch tabs safely
    const handleTabChange = (tab) => {
        setActiveTab(tab)
    }

    return (
        <div className="app">
            {/* Navigation */}
            <nav className="main-nav">
                <div className="nav-brand" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}>
                    <span className="brand-icon">🤖</span>
                    <span className="brand-text">HRC AI</span>
                </div>
                <div className="nav-tabs">
                    <button
                        className={`nav-tab ${activeTab === 'problem-solver' ? 'active' : ''}`}
                        onClick={() => setActiveTab('problem-solver')}
                    >
                        <span className="tab-icon">💻</span>
                        Problem Solver
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <span className="tab-icon">📊</span>
                        Dashboard
                    </button>

                    {/* Auth Status / Action Button */}
                    {user ? (
                        <button
                            className="nav-tab logout-btn"
                            onClick={() => {
                                logout();
                                setActiveTab('login');
                            }}
                            style={{ marginLeft: '1rem', background: 'rgba(255,100,100,0.1)', color: '#ffaaaa' }}
                        >
                            Logout
                        </button>
                    ) : (
                        <button
                            className={`nav-tab ${activeTab === 'login' ? 'active' : ''}`}
                            onClick={() => setActiveTab('login')}
                            style={{ marginLeft: '1rem', background: 'rgba(100,255,100,0.1)', color: '#aaffaa' }}
                        >
                            Login
                        </button>
                    )}
                </div>
            </nav>

            {/* Content Area */}
            <main className="main-content">

                {/* 3. Signup Page */}
                {activeTab === 'signup' && <Signup onSwitchToLogin={() => setActiveTab('login')} onSwitchToHome={() => setActiveTab('home')} />}


                {/* 2. Login Page - Explicitly selected */}
                {activeTab === 'login' && (!user ? <Login onSwitchToSignup={() => setActiveTab('signup')} /> : <div className="already-logged-in">You are already logged in!</div>)}

                {/* 3. Protected Routes - Show Login if !user */}
                {activeTab === 'problem-solver' && (user ? <ProblemSolver /> : <Login onSwitchToSignup={() => setActiveTab('signup')} />)}
                {activeTab === 'dashboard' && (user ? <Dashboard /> : <Login onSwitchToSignup={() => setActiveTab('signup')} />)}
            </main>
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    )
}

export default App
