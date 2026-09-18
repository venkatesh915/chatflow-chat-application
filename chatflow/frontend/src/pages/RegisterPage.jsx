import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, User, AtSign, Mail, Phone, Lock, Camera, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadService } from '../services/uploadService';
import { Avatar } from '../components/common/Avatar';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadService.uploadFile(file);
      setProfileImage(res.file_url);
    } catch (err) {
      setError('Failed to upload avatar image.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim() || null,
        password,
        confirm_password: confirmPassword,
        profile_image: profileImage || null,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create account.');
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
        padding: '30px 20px',
        position: 'relative',
      }}
    >
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
          maxWidth: '520px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <MessageSquare size={26} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff' }}>
            ChatFlow
          </span>
        </div>

        <div
          className="modal-card animate-pop-in"
          style={{
            width: '100%',
            backgroundColor: 'var(--bg-modal)',
            padding: '32px',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>
            Create an Account
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Join ChatFlow and connect with friends in real time.
          </p>

          {error && (
            <div
              style={{
                color: 'var(--status-danger)',
                background: 'rgba(234, 67, 53, 0.1)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                border: '1px solid rgba(234, 67, 53, 0.2)',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Optional Avatar Upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
              <div style={{ position: 'relative' }}>
                <Avatar src={profileImage} name={name || 'User'} size="lg" />
                <label
                  htmlFor="reg-avatar-upload"
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    background: 'var(--brand-primary)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Upload profile picture"
                >
                  <Camera size={13} />
                </label>
                <input
                  id="reg-avatar-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Upload profile photo (optional)
              </div>
            </div>

            {/* Full Name & Username in 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '8px 12px', gap: '8px' }}>
                  <User size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '8px 12px', gap: '8px' }}>
                  <AtSign size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '8px 12px', gap: '8px' }}>
                  <Mail size={16} color="var(--text-muted)" />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '8px 12px', gap: '8px' }}>
                  <Phone size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '8px 12px', gap: '8px' }}>
                  <Lock size={16} color="var(--text-muted)" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', borderRadius: '8px', padding: '8px 12px', gap: '8px' }}>
                  <Lock size={16} color="var(--text-muted)" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
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
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--brand-primary)', fontWeight: '600' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
