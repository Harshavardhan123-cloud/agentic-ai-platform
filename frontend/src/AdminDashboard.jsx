import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import LoginIcon from '@mui/icons-material/Login';

const AdminDashboard = () => {
    const { authFetch } = useAuth();
    const [stats, setStats] = useState({ total_users: 0, active_sessions: 0 });
    const [users, setUsers] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [showUsersDialog, setShowUsersDialog] = useState(false);
    const [showSessionsDialog, setShowSessionsDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_BASE = import.meta.env.VITE_API_URL || 'https://agentic-ai-platform-1-e7zu.onrender.com';

    // Fetch stats
    const fetchStats = async () => {
        try {
            const response = await authFetch(`${API_BASE}/api/auth/admin/stats`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await authFetch(`${API_BASE}/api/auth/admin/users`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            }
        } catch (err) {
            setError('Failed to load users');
        }
        setLoading(false);
    };

    // Fetch sessions
    const fetchSessions = async () => {
        setLoading(true);
        try {
            const response = await authFetch(`${API_BASE}/api/auth/admin/sessions`);
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions || []);
            }
        } catch (err) {
            setError('Failed to load sessions');
        }
        setLoading(false);
    };

    // Block user
    const handleBlock = async (userId) => {
        try {
            const response = await authFetch(`${API_BASE}/api/auth/admin/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            if (response.ok) {
                fetchUsers();
                fetchStats();
            }
        } catch (err) {
            setError('Failed to block user');
        }
    };

    // Unblock user
    const handleUnblock = async (userId) => {
        try {
            const response = await authFetch(`${API_BASE}/api/auth/admin/unblock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            if (response.ok) {
                fetchUsers();
                fetchStats();
            }
        } catch (err) {
            setError('Failed to unblock user');
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Dialog styles
    const dialogOverlay = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    };

    const dialogContent = {
        background: 'var(--bg-secondary)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        border: '1px solid var(--border-subtle)'
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '16px'
    };

    const thStyle = {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        fontWeight: 500
    };

    const tdStyle = {
        padding: '12px',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '0.9rem'
    };

    return (
        <div style={{ padding: '24px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>Admin Dashboard</h2>

            {error && (
                <div style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    color: '#fca5a5',
                    marginBottom: '16px'
                }}>
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {/* Total Users Card */}
                <div
                    className="glass-card"
                    style={{ padding: '20px', cursor: 'pointer' }}
                    onClick={() => { fetchUsers(); setShowUsersDialog(true); }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <PeopleIcon style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 600 }}>{stats.total_users}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Registered Users</div>
                        </div>
                    </div>
                </div>

                {/* Active Sessions Card */}
                <div
                    className="glass-card"
                    style={{ padding: '20px', cursor: 'pointer' }}
                    onClick={() => { fetchSessions(); setShowSessionsDialog(true); }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <LoginIcon style={{ color: '#10b981' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 600 }}>{stats.active_sessions}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active Sessions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refresh Button */}
            <button
                onClick={fetchStats}
                className="form-btn"
                style={{ width: 'auto', padding: '10px 20px' }}
            >
                <RefreshIcon fontSize="small" /> Refresh Stats
            </button>

            {/* Users Dialog */}
            {showUsersDialog && (
                <div style={dialogOverlay} onClick={() => setShowUsersDialog(false)}>
                    <div style={dialogContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0 }}>Registered Users</h3>
                            <button
                                onClick={() => setShowUsersDialog(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
                        ) : users.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No users found</div>
                        ) : (
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>ID</th>
                                        <th style={thStyle}>Name</th>
                                        <th style={thStyle}>Email</th>
                                        <th style={thStyle}>Phone</th>
                                        <th style={thStyle}>Country</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td style={tdStyle}>{user.id}</td>
                                            <td style={tdStyle}>{user.name || '-'}</td>
                                            <td style={tdStyle}>{user.username}</td>
                                            <td style={tdStyle}>{user.phone || '-'}</td>
                                            <td style={tdStyle}>{user.country || '-'}</td>
                                            <td style={tdStyle}>
                                                {user.is_blocked ? (
                                                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <BlockIcon fontSize="small" /> Blocked
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <CheckCircleIcon fontSize="small" /> Active
                                                    </span>
                                                )}
                                            </td>
                                            <td style={tdStyle}>
                                                {user.is_blocked ? (
                                                    <button
                                                        onClick={() => handleUnblock(user.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                                            borderRadius: '6px',
                                                            color: '#10b981',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        Unblock
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBlock(user.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                                            borderRadius: '6px',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        Block
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Sessions Dialog */}
            {showSessionsDialog && (
                <div style={dialogOverlay} onClick={() => setShowSessionsDialog(false)}>
                    <div style={dialogContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0 }}>Active Sessions</h3>
                            <button
                                onClick={() => setShowSessionsDialog(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
                        ) : sessions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No active sessions</div>
                        ) : (
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>ID</th>
                                        <th style={thStyle}>Username</th>
                                        <th style={thStyle}>Login Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map(session => (
                                        <tr key={session.id}>
                                            <td style={tdStyle}>{session.id}</td>
                                            <td style={tdStyle}>{session.username}</td>
                                            <td style={tdStyle}>{new Date(session.login_time).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
