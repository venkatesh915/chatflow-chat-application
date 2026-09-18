import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email/username or password.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Account Login
  const handleQuickDemoLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setLoading(true);
    setError('');
    try {
      await login(demoEmail, 'Password123!');
      navigate('/');
    } catch (err) {
      setError('Demo login failed. Make sure backend is running and seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '20px',
        position: 'relative',
      }}
    >
      {/* Top Banner accent stripe like WhatsApp Web */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '220px',
          backgroundColor: 'var(--brand-primary)',
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '460px',
        }}
      >
        {/* App Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <MessageSquare size={28} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '26px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.5px' }}>
            ChatFlow
          </span>
        </div>

        {/* Card */}
        <div
          className="modal-card animate-pop-in"
          style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: 'var(--bg-modal)',
            padding: '36px 32px',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Sign in to your ChatFlow account to continue.
          </p>

          {error && (
            <div
              style={{
                color: 'var(--status-danger)',
                background: 'rgba(234, 67, 53, 0.1)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '18px',
                border: '1px solid rgba(234, 67, 53, 0.2)',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Email or Username</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  gap: '10px',
                }}
              >
                <Mail size={18} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="name@chatflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', fontSize: '14px' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  gap: '10px',
                }}
              >
                <Lock size={18} color="var(--text-muted)" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', fontSize: '14px' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                borderRadius: '8px',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
              Quick Demo Login:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '12.5px', padding: '7px 10px', borderRadius: '6px' }}
                onClick={() => handleQuickDemoLogin('alice@chatflow.com')}
              >
                <UserCheck size={14} style={{ marginRight: '6px', color: 'var(--brand-primary)' }} /> Alice (Host)
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '12.5px', padding: '7px 10px', borderRadius: '6px' }}
                onClick={() => handleQuickDemoLogin('bob@chatflow.com')}
              >
                <UserCheck size={14} style={{ marginRight: '6px', color: 'var(--brand-primary)' }} /> Bob (Tester)
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '12.5px', padding: '7px 10px', borderRadius: '6px' }}
                onClick={() => handleQuickDemoLogin('charlie@chatflow.com')}
              >
                <UserCheck size={14} style={{ marginRight: '6px', color: 'var(--brand-primary)' }} /> Charlie
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '12.5px', padding: '7px 10px', borderRadius: '6px' }}
                onClick={() => handleQuickDemoLogin('diana@chatflow.com')}
              >
                <UserCheck size={14} style={{ marginRight: '6px', color: 'var(--brand-primary)' }} /> Diana
              </button>
            </div>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--brand-primary)', fontWeight: '600' }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
