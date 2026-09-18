import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('chatflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('chatflow_token') || null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('chatflow_token');
      if (savedToken) {
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
          localStorage.setItem('chatflow_user', JSON.stringify(freshUser));
        } catch (e) {
          // Token is invalid/expired
          localStorage.removeItem('chatflow_token');
          localStorage.removeItem('chatflow_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('chatflow_token', res.access_token);
    localStorage.setItem('chatflow_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('chatflow_token', res.access_token);
    localStorage.setItem('chatflow_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = async () => {
    try {
      if (token) {
        await authService.logout().catch(() => {});
      }
    } finally {
      localStorage.removeItem('chatflow_token');
      localStorage.removeItem('chatflow_user');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('chatflow_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
