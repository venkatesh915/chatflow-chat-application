import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, MoreVertical, ShieldAlert, Trash2, UserCheck, User } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { UserProfileModal } from '../modals/UserProfileModal';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { authService } from '../../services/authService';

export const ChatHeader = ({
  chat,
  onBack,
  onToggleSearch,
  onOpenGroupInfo,
  onConfirmClear,
}) => {
  const { user } = useAuth();
  const { typingUsers, userPresence, deleteChat } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDirect = chat.type === 'direct';
  const otherUser = chat.other_user;

  // Live presence
  const otherPresence = otherUser ? userPresence[otherUser.id] : null;
  const isOnline = otherPresence ? otherPresence.is_online : otherUser?.is_online;
  const lastSeenStr = otherPresence?.last_seen || otherUser?.last_seen;

  // Live typing
  const activeTypers = typingUsers[chat.id] || [];
  const isTyping = activeTypers.length > 0;

  let typingText = '';
  if (isTyping) {
    if (activeTypers.length === 1) {
      typingText = `${activeTypers[0].userName} is typing...`;
    } else {
      typingText = `${activeTypers.map((t) => t.userName).join(', ')} are typing...`;
    }
  }

  // Format last seen subtitle
  const formatLastSeen = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `last seen today at ${time}` : `last seen ${date.toLocaleDateString()} at ${time}`;
  };

  const subtitle = isTyping
    ? typingText
    : isDirect
    ? isOnline
      ? 'online'
      : formatLastSeen(lastSeenStr)
    : chat.members
        ?.map((m) => m.name)
        .slice(0, 4)
        .join(', ') + (chat.members?.length > 4 ? '...' : '');

  const handleBlockUser = async () => {
    if (!otherUser) return;
    try {
      if (isBlocked) {
        await authService.unblockUser(otherUser.id);
        setIsBlocked(false);
      } else {
        await authService.blockUser(otherUser.id);
        setIsBlocked(true);
      }
    } catch (e) {
      console.error(e);
    }
    setShowMenu(false);
  };

  const handleHeaderClick = () => {
    if (chat.type === 'group') {
      onOpenGroupInfo();
    } else if (isDirect && otherUser) {
      setShowProfileModal(true);
    }
  };

  return (
    <>
      <header className="chat-header">
        <div className="chat-header-user">
          {/* Mobile Back Button */}
          <button
            className="icon-btn"
            onClick={onBack}
            style={{ marginRight: '-4px' }}
            title="Back to chats"
          >
            <ArrowLeft size={20} />
          </button>

          <Avatar
            src={chat.group_image}
            name={chat.name}
            size="md"
            isOnline={isOnline}
            showOnline={isDirect}
            onClick={handleHeaderClick}
          />

          <div
            className="chat-header-meta"
            onClick={handleHeaderClick}
            style={{ cursor: 'pointer' }}
          >
            <span className="chat-header-title">{chat.name}</span>
            {subtitle && (
              <span className={`chat-header-status ${isOnline || isTyping ? 'online' : ''}`}>
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} ref={menuRef}>
          <button className="icon-btn" onClick={onToggleSearch} title="Search in chat">
            <Search size={19} />
          </button>

          <button
            className={`icon-btn ${showMenu ? 'active' : ''}`}
            onClick={() => setShowMenu(!showMenu)}
            title="Chat menu"
          >
            <MoreVertical size={19} />
          </button>

          {showMenu && (
            <div className="dropdown-menu animate-pop-in" style={{ top: '48px', right: '0' }}>
              {isDirect && (
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setShowMenu(false);
                    setShowProfileModal(true);
                  }}
                >
                  <User size={16} /> Contact info
                </div>
              )}

              {isDirect && (
                <div className="dropdown-item" onClick={handleBlockUser}>
                  {isBlocked ? <UserCheck size={16} /> : <ShieldAlert size={16} />}
                  {isBlocked ? 'Unblock contact' : 'Block contact'}
                </div>
              )}

              <div
                className="dropdown-item danger"
                onClick={() => {
                  setShowMenu(false);
                  onConfirmClear();
                }}
              >
                <Trash2 size={16} /> Clear chat
              </div>
            </div>
          )}
        </div>
      </header>

      {/* User Profile Modal */}
      {isDirect && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={otherUser?.id}
          fallbackUser={otherUser}
        />
      )}
    </>
  );
};
