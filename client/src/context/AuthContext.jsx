import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    const startupToken = localStorage.getItem('dripstore_token');
    if (!startupToken) { setInitializing(false); return; }
    api.get('/auth/me').then(({ data }) => { if (active && localStorage.getItem('dripstore_token') === startupToken) setUser(data.user); })
      .catch(() => { if (active) setError('Session could not be restored. Please sign in.'); })
      .finally(() => { if (active) setInitializing(false); });
    return () => { active = false; };
  }, []);

  const saveAuth = (token, userData) => {
    localStorage.setItem('dripstore_token', token);
    localStorage.setItem('dripstore_user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      saveAuth(data.token, data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      saveAuth(data.token, data.user);
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* Local logout still works offline. */ }
    localStorage.removeItem('dripstore_token');
    localStorage.removeItem('dripstore_user');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', profileData);
      if (data.token) localStorage.setItem('dripstore_token', data.token);
      localStorage.setItem('dripstore_user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Update failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, initializing, error, register, login, logout, updateProfile, setError, saveAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
