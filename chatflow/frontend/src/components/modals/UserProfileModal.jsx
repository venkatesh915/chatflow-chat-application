import React, { useState, useEffect } from 'react';
import { X, Phone, Info, Shield, Clock } from 'lucide-react';
import { authService } from '../../services/authService';
import { Avatar } from '../common/Avatar';
import { formatTimeAgo } from '../../utils/formatters';

export const UserProfileModal = ({ isOpen, onClose, userId, fallbackUser }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !userId) {
      setProfile(null);
      setError('');
      return;
    }

    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await authService.getUserProfile(userId);
        if (isMounted) setProfile(data);
      } catch (err) {
        if (isMounted) {
          // If profile fetch fails, fallback to provided user info
          if (fallbackUser) {
            setProfile(fallbackUser);
          } else {
            setError('Unable to load user profile.');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, fallbackUser]);

  if (!isOpen) return null;

  const displayUser = profile || fallbackUser || {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card animate-pop-in"
        style={{ maxWidth: '420px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-sidebar-header)'
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Contact Info</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px 20px' }}>
          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading profile...
            </div>
          ) : error ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--status-danger)' }}>
              {error}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Profile Image */}
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <Avatar
                  src={displayUser.profile_image}
                  name={displayUser.name || 'User'}
                  size="xl"
                  isOnline={displayUser.is_online}
                  showOnline={displayUser.is_online}
                />
              </div>

              {/* Name & Username */}
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px', color: 'var(--text-primary)' }}>
                {displayUser.name || 'ChatFlow User'}
              </h3>
              <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                @{displayUser.username || ''}
              </div>

              {/* Online / Last seen status */}
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                {displayUser.is_online ? (
                  <span style={{ color: 'var(--brand-primary)', fontWeight: '600' }}>● Online</span>
                ) : displayUser.last_seen ? (
                  <span>Last seen {formatTimeAgo(displayUser.last_seen)}</span>
                ) : null}
              </div>

              {/* Details Cards */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* About (Bio) */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: 'var(--brand-primary)' }}>
                    <Info size={16} />
                    <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>About</span>
                  </div>
                  <div style={{ fontSize: '14px', color: displayUser.about ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {displayUser.about || 'No about status available.'}
                  </div>
                </div>

                {/* Phone Number (if visible according to privacy) */}
                {displayUser.phone && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      padding: '14px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: 'var(--brand-primary)' }}>
                      <Phone size={16} />
                      <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {displayUser.phone}
                    </div>
                  </div>
                )}

                {/* Privacy Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    paddingTop: '8px'
                  }}
                >
                  <Shield size={14} /> End-to-end encrypted • Privacy protected
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
