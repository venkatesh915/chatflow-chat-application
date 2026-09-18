import React, { useState, useEffect } from 'react';
import { X, Users, Search, Check, Camera } from 'lucide-react';
import { authService } from '../../services/authService';
import { chatService } from '../../services/chatService';
import { uploadService } from '../../services/uploadService';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const NewGroupModal = ({ isOpen, onClose }) => {
  const { selectChat, loadChats } = useChat();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [groupImage, setGroupImage] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const list = await authService.searchUsers(searchTerm);
        setUsers(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, searchTerm]);

  if (!isOpen) return null;

  const handleToggleMember = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadService.uploadFile(file);
      setGroupImage(res.file_url);
    } catch (err) {
      setError('Failed to upload group image.');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Please select at least one member.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const group = await chatService.createGroup({
        name: groupName.trim(),
        description: description.trim(),
        group_image: groupImage || null,
        member_ids: selectedUserIds,
      });

      await loadChats();
      selectChat(group.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Group</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreateGroup}>
          <div className="modal-body" style={{ maxHeight: '550px' }}>
            {error && (
              <div style={{ color: 'var(--status-danger)', fontSize: '13px', background: 'rgba(234,67,53,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                {error}
              </div>
            )}

            {/* Group Picture & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Avatar src={groupImage} name={groupName || 'Group'} size="lg" />
                <label
                  htmlFor="group-img-upload"
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
                  title="Upload group picture"
                >
                  <Camera size={13} />
                </label>
                <input
                  id="group-img-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </div>

              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Group subject / name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Group description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Add Members Section */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                ADD MEMBERS ({selectedUserIds.length} selected)
              </div>

              <div className="search-input-wrapper" style={{ marginBottom: '10px' }}>
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {users.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleToggleMember(u.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar src={u.profile_image} name={u.name} size="sm" />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{u.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{u.username}</div>
                        </div>
                      </div>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          border: isSelected ? 'none' : '2px solid var(--border-strong)',
                          backgroundColor: isSelected ? 'var(--brand-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
