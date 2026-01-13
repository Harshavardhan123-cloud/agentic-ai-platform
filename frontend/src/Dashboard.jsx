import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import './Dashboard.css'

function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [autoRefresh, setAutoRefresh] = useState(true)
    const { getAuthHeader } = useAuth()

    const fetchDashboard = async () => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
                headers: getAuthHeader()
            })
            if (!response.ok) throw new Error('Failed to fetch dashboard')
            const data = await response.json()
            setDashboardData(data)
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboard()

        if (autoRefresh) {
            const interval = setInterval(fetchDashboard, 5000)
            return () => clearInterval(interval)
        }
    }, [autoRefresh])

    const formatUptime = (seconds) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hours}h ${minutes}m ${secs}s`
    }

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading-container">
                    <div className="spinner-large"></div>
                    <p>Loading Dashboard...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="dashboard">
                <div className="error-container">
                    <span className="error-icon">⚠️</span>
                    <p>Error: {error}</p>
                    <button onClick={fetchDashboard} className="retry-btn">Retry</button>
                </div>
            </div>
        )
    }

    const { system, agents, recent_activity, health } = dashboardData || {}

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-title">
                    <span className="icon">📊</span>
                    <h1>HRC AI Dashboard</h1>
                </div>
                <div className="header-controls">
                    <label className="auto-refresh">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        Auto-refresh (5s)
                    </label>
                    <button onClick={fetchDashboard} className="refresh-btn">
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Health Status */}
            <div className="health-banner">
                <div className={`health-status ${health?.status}`}>
                    <span className="health-icon">
                        {health?.status === 'healthy' ? '✅' : '⚠️'}
                    </span>
                    <span>System: {health?.status?.toUpperCase()}</span>
                </div>
                <div className="health-details">
                    <span>Agents: {health?.agents_active}/{health?.agents_total}</span>
                    <span>LLM: {health?.llm_available ? '✅ Available' : '❌ Unavailable'}</span>
                </div>
            </div>

            {/* System Metrics */}
            <div className="metrics-section">
                <h2>📈 System Metrics</h2>
                <div className="metrics-grid">
                    <div className="metric-card total">
                        <div className="metric-value">{system?.total_requests || 0}</div>
                        <div className="metric-label">Total Requests</div>
                    </div>
                    <div className="metric-card code">
                        <div className="metric-value">{system?.total_code_generations || 0}</div>
                        <div className="metric-label">Code Generations</div>
                    </div>
                    <div className="metric-card complexity">
                        <div className="metric-value">{system?.total_complexity_analyses || 0}</div>
                        <div className="metric-label">Complexity Analyses</div>
                    </div>
                    <div className="metric-card optimize">
                        <div className="metric-value">{system?.total_optimizations || 0}</div>
                        <div className="metric-label">Optimizations</div>
                    </div>
                    <div className="metric-card length">
                        <div className="metric-value">{Math.round(system?.avg_code_length || 0)}</div>
                        <div className="metric-label">Avg Code Length</div>
                    </div>
                    <div className="metric-card uptime">
                        <div className="metric-value">{formatUptime(system?.uptime_seconds || 0)}</div>
                        <div className="metric-label">Uptime</div>
                    </div>
                </div>
            </div>

            {/* LLM Info */}
            <div className="llm-section">
                <h2>🤖 LLM Provider</h2>
                <div className="llm-info">
                    <div className="llm-item">
                        <span className="llm-label">Provider:</span>
                        <span className="llm-value provider">{system?.llm_provider || 'None'}</span>
                    </div>
                    <div className="llm-item">
                        <span className="llm-label">Model:</span>
                        <span className="llm-value model">{system?.model_used || 'None'}</span>
                    </div>
                </div>
            </div>

            {/* Language Usage */}
            {system?.languages_used && Object.keys(system.languages_used).length > 0 && (
                <div className="languages-section">
                    <h2>🌐 Languages Used</h2>
                    <div className="languages-grid">
                        {Object.entries(system.languages_used).map(([lang, count]) => (
                            <div key={lang} className="language-tag">
                                <span className="lang-name">{lang}</span>
                                <span className="lang-count">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Agent Metrics */}
            <div className="agents-section">
                <h2>🤖 Agent Metrics</h2>
                <div className="agents-grid">
                    {agents && Object.entries(agents).map(([name, metrics]) => (
                        <div key={name} className={`agent-card ${metrics.status}`}>
                            <div className="agent-header">
                                <span className="agent-name">{metrics.agent_name}</span>
                                <span className={`agent-status ${metrics.status}`}>
                                    {metrics.status}
                                </span>
                            </div>
                            <div className="agent-metrics">
                                <div className="agent-stat">
                                    <span className="stat-value">{metrics.total_calls}</span>
                                    <span className="stat-label">Calls</span>
                                </div>
                                <div className="agent-stat">
                                    <span className="stat-value">{metrics.success_rate}%</span>
                                    <span className="stat-label">Success</span>
                                </div>
                                <div className="agent-stat">
                                    <span className="stat-value">{metrics.avg_response_time}s</span>
                                    <span className="stat-label">Avg Time</span>
                                </div>
                                <div className="agent-stat">
                                    <span className="stat-value">{metrics.tasks_completed}</span>
                                    <span className="stat-label">Tasks</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            {recent_activity && recent_activity.length > 0 && (
                <div className="activity-section">
                    <h2>📋 Recent Activity</h2>
                    <div className="activity-list">
                        {recent_activity.slice().reverse().map((activity, index) => (
                            <div key={index} className={`activity-item ${activity.success ? 'success' : 'failed'}`}>
                                <span className="activity-icon">
                                    {activity.success ? '✅' : '❌'}
                                </span>
                                <span className="activity-type">{activity.type}</span>
                                {activity.language && (
                                    <span className="activity-lang">{activity.language}</span>
                                )}
                                <span className="activity-time">
                                    {new Date(activity.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="dashboard-footer">
                <p>HRC AI Dashboard • Powered by Groq + Llama 3.3</p>
            </div>
        </div>
    )
}

export default Dashboard
