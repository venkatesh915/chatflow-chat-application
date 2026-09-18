import React, { useState, useEffect } from 'react';
import { X, Search, MessageSquare, User } from 'lucide-react';
import { authService } from '../../services/authService';
import { chatService } from '../../services/chatService';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const NewChatModal = ({ isOpen, onClose }) => {
  const { selectChat, loadChats } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setUsers([]);
      setError('');
      return;
    }

    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setUsers([]);
      setLoading(false);
      setError('');
      return;
    }

    let isMounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const list = await authService.searchUsers(trimmed);
        if (isMounted) setUsers(list);
      } catch (err) {
        if (isMounted) setError('Failed to search users.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const delay = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(delay);
    };
  }, [isOpen, searchTerm]);

  if (!isOpen) return null;

  const handleStartChat = async (targetUserId) => {
    setCreating(true);
    try {
      const chat = await chatService.createDirectChat(targetUserId);
      await loadChats();
      selectChat(chat.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start conversation.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Chat</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by username (@rahul) or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="modal-body" style={{ padding: '0', maxHeight: '420px', minHeight: '260px' }}>
          {error && (
            <div style={{ color: 'var(--status-danger)', padding: '12px 16px', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {!searchTerm.trim() ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Search size={36} style={{ opacity: 0.35, marginBottom: '12px' }} />
              <div style={{ fontWeight: '500', fontSize: '14.5px', color: 'var(--text-secondary)' }}>
                Search for someone to start chatting
              </div>
              <div style={{ fontSize: '12.5px', marginTop: '6px', opacity: 0.8 }}>
                Enter a username (e.g. <code>@rahul123</code>) or phone number (e.g. <code>9876543210</code>).
              </div>
            </div>
          ) : loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Searching...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <User size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <div style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                No user found matching "{searchTerm.trim()}"
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Make sure the username or phone number is correct.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => !creating && handleStartChat(u.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 20px',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Avatar
                    src={u.profile_image}
                    name={u.name}
                    size="md"
                    isOnline={u.is_online}
                    showOnline={true}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '14.5px', color: 'var(--text-primary)' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      @{u.username}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '13px', padding: '6px 14px' }}
                    disabled={creating}
                  >
                    <MessageSquare size={15} style={{ marginRight: '6px' }} />
                    Chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
