import React, { useState } from 'react'
import Home from './Home'
import ProblemSolver from './ProblemSolver'
import Dashboard from './Dashboard'
import './App.css'

function App() {
    const [activeTab, setActiveTab] = useState('home')

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

export default App
