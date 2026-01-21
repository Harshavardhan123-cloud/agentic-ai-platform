import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // API URL - Uses same env variable as ProblemSolver
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Check session on mount (using cookies)
    useEffect(() => {
        const checkSession = async () => {
            try {
                // First check localStorage for backward compatibility
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }

                // Also try to get user from session cookie
                const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    credentials: 'include',  // Include cookies
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                }
            } catch (err) {
                console.log("Session check failed:", err);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                credentials: 'include',  // Include cookies in request
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store in localStorage for backward compatibility
                if (data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                }
                if (data.refresh_token) {
                    localStorage.setItem('refresh_token', data.refresh_token);
                }
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, error: data.msg || 'Login failed' };
            }
        } catch (err) {
            console.error("Login error:", err);
            return { success: false, error: "Connection error" };
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: data.msg || 'Registration failed' };
            }
        } catch (err) {
            console.error("Registration error:", err);
            return { success: false, error: "Connection error" };
        }
    };

    const logout = async () => {
        try {
            // Call backend logout to clear cookies
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.log("Logout request failed:", err);
        }

        // Clear local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
    };

    // Refresh token when needed
    const refreshToken = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.access_token) {
                    localStorage.setItem('access_token', data.access_token);
                }
                return true;
            }
            return false;
        } catch (err) {
            console.error("Token refresh failed:", err);
            return false;
        }
    };

    // Helper to get auth header (for backward compatibility with header-based auth)
    const getAuthHeader = () => {
        const token = localStorage.getItem('access_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    // Fetch with credentials helper
    const authFetch = async (url, options = {}) => {
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
                ...options.headers
            }
        });

        // If unauthorized, try to refresh token
        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
                // Retry request with new token
                return fetch(url, {
                    ...options,
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeader(),
                        ...options.headers
                    }
                });
            } else {
                // Refresh failed, logout
                await logout();
            }
        }

        return response;
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        refreshToken,
        getAuthHeader,
        authFetch
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

