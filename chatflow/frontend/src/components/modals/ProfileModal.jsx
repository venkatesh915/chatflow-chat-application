import React, { useState } from 'react';
import { X, Camera, Check, User, Phone, Info, AtSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { uploadService } from '../../services/uploadService';
import { Avatar } from '../common/Avatar';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [about, setAbout] = useState(user?.about || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadService.uploadFile(file);
      setProfileImage(res.file_url);
    } catch (err) {
      setError('Failed to upload image. Max 25MB.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await authService.updateProfile({
        name,
        username,
        about,
        phone,
        profile_image: profileImage,
      });
      updateUser(updated);
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Your Profile</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {error && (
              <div style={{ color: 'var(--status-danger)', fontSize: '13px', background: 'rgba(234,67,53,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ color: 'var(--brand-primary)', fontSize: '13px', background: 'rgba(0,168,132,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                {success}
              </div>
            )}

            {/* Profile Picture with Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0 16px 0' }}>
              <div style={{ position: 'relative' }}>
                <Avatar src={profileImage} name={name} size="xxl" />
                <label
                  htmlFor="avatar-file-input"
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    backgroundColor: 'var(--brand-primary)',
                    color: '#ffffff',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)',
                  }}
                  title="Change profile picture"
                >
                  <Camera size={18} />
                </label>
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Click camera to change photo
              </span>
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} /> Full Name
              </label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Username */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AtSign size={13} /> Username
              </label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* About / Status */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={13} /> About
              </label>
              <input
                type="text"
                className="form-input"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Hey there! I am using ChatFlow."
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={13} /> Phone
              </label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
