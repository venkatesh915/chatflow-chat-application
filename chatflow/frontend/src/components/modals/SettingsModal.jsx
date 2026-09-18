import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Bell, Volume2, Shield, KeyRound, UserX, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { authService } from '../../services/authService';
import { Avatar } from '../common/Avatar';

export const SettingsModal = ({ isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const { soundEnabled, toggleSound, notificationsEnabled, requestNotificationPermission } = useNotification();

  const [activeTab, setActiveTab] = useState('appearance');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // Privacy settings states
  const [privacySettings, setPrivacySettings] = useState({
    profile_photo: 'everyone',
    about: 'everyone',
    last_seen: 'everyone',
    online_status: 'everyone',
    read_receipts: true,
    group_add: 'everyone'
  });
  const [loadingPrivacy, setLoadingPrivacy] = useState(false);
  const [privacySavedMsg, setPrivacySavedMsg] = useState('');

  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (activeTab === 'privacy') {
      loadPrivacySettings();
      loadBlockedUsers();
    }
  }, [isOpen, activeTab]);

  const loadPrivacySettings = async () => {
    setLoadingPrivacy(true);
    try {
      const data = await authService.getPrivacySettings();
      if (data) {
        setPrivacySettings({
          profile_photo: data.profile_photo || 'everyone',
          about: data.about || 'everyone',
          last_seen: data.last_seen || 'everyone',
          online_status: data.online_status || 'everyone',
          read_receipts: data.read_receipts !== undefined ? data.read_receipts : true,
          group_add: data.group_add || 'everyone'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPrivacy(false);
    }
  };

  const handleUpdatePrivacy = async (field, value) => {
    const updated = { ...privacySettings, [field]: value };
    setPrivacySettings(updated);
    try {
      await authService.updatePrivacySettings(updated);
      setPrivacySavedMsg('Privacy setting updated');
      setTimeout(() => setPrivacySavedMsg(''), 2500);
    } catch (e) {
      console.error('Failed to update privacy:', e);
    }
  };

  const loadBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const list = await authService.getBlockedUsers();
      setBlockedUsers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await authService.unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((b) => b.blocked_id !== userId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwSaving(true);
    try {
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      setPwSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card animate-pop-in" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-sidebar-header)' }}>
          <button
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '13.5px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderBottom: activeTab === 'appearance' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              color: activeTab === 'appearance' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            }}
            onClick={() => setActiveTab('appearance')}
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} Appearance
          </button>

          <button
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '13.5px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderBottom: activeTab === 'notifications' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              color: activeTab === 'notifications' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            }}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={16} /> Notifications
          </button>

          <button
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '13.5px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderBottom: activeTab === 'privacy' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              color: activeTab === 'privacy' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            }}
            onClick={() => setActiveTab('privacy')}
          >
            <Shield size={16} /> Privacy
          </button>

          <button
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '13.5px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderBottom: activeTab === 'security' ? '2px solid var(--brand-primary)' : '2px solid transparent',
              color: activeTab === 'security' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            }}
            onClick={() => setActiveTab('security')}
          >
            <KeyRound size={16} /> Security
          </button>
        </div>

        <div className="modal-body" style={{ minHeight: '280px', maxHeight: '450px' }}>
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Theme</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Choose your preferred ChatFlow visual theme.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div
                  onClick={() => theme !== 'light' && toggleTheme()}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: `2px solid ${theme === 'light' ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
                    backgroundColor: '#ffffff',
                    color: '#111b21',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <Sun size={24} color="#00a884" />
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>Light Mode</span>
                  {theme === 'light' && (
                    <span style={{ fontSize: '11px', color: '#00a884', fontWeight: '700' }}>Active</span>
                  )}
                </div>

                <div
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: `2px solid ${theme === 'dark' ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
                    backgroundColor: '#111b21',
                    color: '#e9edef',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <Moon size={24} color="#00a884" />
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>Dark Mode</span>
                  {theme === 'dark' && (
                    <span style={{ fontSize: '11px', color: '#00a884', fontWeight: '700' }}>Active</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Volume2 size={20} color="var(--brand-primary)" />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14.5px' }}>Message Sounds</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      Play pleasant audio chime for incoming messages
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={toggleSound}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Bell size={20} color="var(--brand-primary)" />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14.5px' }}>Desktop Notifications</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      Show system notifications when ChatFlow is in background
                    </div>
                  </div>
                </div>
                {notificationsEnabled ? (
                  <span style={{ color: 'var(--brand-primary)', fontSize: '12px', fontWeight: '600' }}>
                    Enabled
                  </span>
                ) : (
                  <button className="btn-secondary" style={{ padding: '6px 12px' }} onClick={requestNotificationPermission}>
                    Enable
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & BLOCKED */}
          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {privacySavedMsg && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(0, 168, 132, 0.12)',
                  color: 'var(--brand-primary)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Check size={16} /> {privacySavedMsg}
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '14.5px', fontWeight: '600', marginBottom: '2px', color: 'var(--text-primary)' }}>
                  Who can see my personal info
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Manage who can see your profile photo, about info, online status, and read receipts.
                </p>
              </div>

              {loadingPrivacy ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading privacy settings...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Profile Photo */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13.5px' }}>Profile Photo</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Who can see your profile image</div>
                    </div>
                    <select
                      className="form-input"
                      style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
                      value={privacySettings.profile_photo}
                      onChange={(e) => handleUpdatePrivacy('profile_photo', e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  {/* About */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13.5px' }}>About (Bio)</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Who can view your About description</div>
                    </div>
                    <select
                      className="form-input"
                      style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
                      value={privacySettings.about}
                      onChange={(e) => handleUpdatePrivacy('about', e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  {/* Last Seen */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13.5px' }}>Last Seen</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Who can see when you were last online</div>
                    </div>
                    <select
                      className="form-input"
                      style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
                      value={privacySettings.last_seen}
                      onChange={(e) => handleUpdatePrivacy('last_seen', e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  {/* Online Status */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13.5px' }}>Online Status</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Who can see when you are active</div>
                    </div>
                    <select
                      className="form-input"
                      style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
                      value={privacySettings.online_status}
                      onChange={(e) => handleUpdatePrivacy('online_status', e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="same_as_last_seen">Same as Last Seen</option>
                    </select>
                  </div>

                  {/* Read Receipts */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ paddingRight: '12px' }}>
                      <div style={{ fontWeight: '600', fontSize: '13.5px' }}>Read Receipts</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        If turned off, you won't send or receive blue checkmark read receipts.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySettings.read_receipts}
                      onChange={(e) => handleUpdatePrivacy('read_receipts', e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--brand-primary)', cursor: 'pointer', flexShrink: 0 }}
                    />
                  </div>

                  {/* Groups */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13.5px' }}>Groups</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Who can add you to group chats</div>
                    </div>
                    <select
                      className="form-input"
                      style={{ width: '150px', padding: '6px 10px', fontSize: '13px' }}
                      value={privacySettings.group_add}
                      onChange={(e) => handleUpdatePrivacy('group_add', e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <div style={{ fontWeight: '600', fontSize: '14.5px', marginBottom: '8px' }}>Blocked Contacts</div>
                {loadingBlocked ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading blocked users...
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <UserX size={28} style={{ opacity: 0.3, marginBottom: '6px' }} />
                    <div style={{ fontSize: '13px' }}>No blocked contacts.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {blockedUsers.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar src={b.blocked_user.profile_image} name={b.blocked_user.name} size="sm" />
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '13.5px' }}>{b.blocked_user.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              @{b.blocked_user.username}
                            </div>
                          </div>
                        </div>
                        <button
                          className="btn-secondary"
                          style={{ padding: '5px 12px', fontSize: '12px' }}
                          onClick={() => handleUnblock(b.blocked_id)}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {pwError && (
                <div style={{ color: 'var(--status-danger)', fontSize: '13px', background: 'rgba(234,67,53,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div style={{ color: 'var(--brand-primary)', fontSize: '13px', background: 'rgba(0,168,132,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                  {pwSuccess}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                disabled={pwSaving}
              >
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
