import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // API URL - Uses same env variable as ProblemSolver
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Hash password using SHA-256 (client-side)
    const hashPassword = async (password) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };

    // Check session on mount (using cookies)
    useEffect(() => {
        const checkSession = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }

                const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    credentials: 'include',
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
            // Hash password before sending (hides plain text in network payload)
            const hashedPassword = await hashPassword(password);

            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password: hashedPassword })
            });

            const data = await response.json();

            if (response.ok) {
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
            // Hash password before sending
            const hashedUserData = {
                ...userData,
                password: await hashPassword(userData.password)
            };

            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hashedUserData)
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
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.log("Logout request failed:", err);
        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
    };

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

    const getAuthHeader = () => {
        const token = localStorage.getItem('access_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

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

        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
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
