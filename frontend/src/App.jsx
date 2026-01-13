import React, { useState } from 'react'
import Home from './Home'
import ProblemSolver from './ProblemSolver'
import Dashboard from './Dashboard'
import Login from './Login'
import { AuthProvider, useAuth } from './AuthContext'
import './App.css'

// Inner component to access AuthContext
const AppContent = () => {
    const [activeTab, setActiveTab] = useState('home')
    const { user, loading } = useAuth()

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

    // Show Login if not authenticated
    if (!user) {
        return <Login />
    }

    // Authenticated App
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
                    <button
                        className="nav-tab logout-btn"
                        onClick={() => window.location.reload()} // Simple logout by refresh (clears state if not persisted or relies on AuthContext)
                        style={{ marginLeft: '1rem', background: 'rgba(255,100,100,0.1)', color: '#ffaaaa' }}
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Content */}
            <main className="main-content">
                {activeTab === 'home' && <Home onStart={setActiveTab} />}
                {activeTab === 'problem-solver' && <ProblemSolver />}
                {activeTab === 'dashboard' && <Dashboard />}
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
