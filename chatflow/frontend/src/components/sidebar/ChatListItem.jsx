import React, { useState, useRef, useEffect } from 'react';
import { Pin, VolumeX, ChevronDown, Trash2, Archive, BellOff, Bell } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { StatusTicks } from '../common/StatusTicks';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export const ChatListItem = ({ chat, isActive, onClick, onConfirmDelete }) => {
  const { user } = useAuth();
  const { togglePin, toggleMute, toggleArchive } = useChat();

  const [showMenu, setShowMenu] = useState(false);
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

  // Format timestamp
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
  };

  const lastMsg = chat.last_message;
  const isDirect = chat.type === 'direct';
  const isOnline = isDirect && chat.other_user?.is_online;

  // Determine snippet text
  let snippet = 'No messages yet';
  if (lastMsg) {
    if (lastMsg.is_deleted) {
      snippet = 'This message was deleted';
    } else if (lastMsg.message_type === 'image') {
      snippet = '📷 Photo';
    } else if (lastMsg.message_type === 'file') {
      snippet = '📎 File';
    } else {
      snippet = lastMsg.content || '';
    }
  }

  const isOutgoing = lastMsg && lastMsg.sender_id === user?.id;

  return (
    <li
      className={`chat-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ position: 'relative' }}
    >
      <Avatar
        src={chat.group_image}
        name={chat.name}
        size="lg"
        isOnline={isOnline}
        showOnline={isDirect}
      />

      <div className="chat-item-info">
        <div className="chat-item-top">
          <span className="chat-item-name">{chat.name}</span>
          <span className="chat-item-time">{formatTime(lastMsg?.created_at || chat.updated_at)}</span>
        </div>

        <div className="chat-item-bottom">
          <div className="chat-item-snippet">
            {isOutgoing && <StatusTicks status={lastMsg?.status} size={14} />}
            <span>{snippet}</span>
          </div>

          <div className="chat-item-badges">
            {chat.is_muted && <VolumeX className="icon-mute" />}
            {chat.is_pinned && <Pin className="icon-pin" />}
            {chat.unread_count > 0 && (
              <span className="unread-badge">{chat.unread_count}</span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Menu Trigger */}
      <button
        className="icon-btn"
        style={{
          position: 'absolute',
          right: '8px',
          top: '24px',
          width: '26px',
          height: '26px',
          opacity: showMenu ? 1 : 0,
        }}
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        title="Chat options"
      >
        <ChevronDown size={18} />
      </button>

      {/* Context Menu Dropdown */}
      {showMenu && (
        <div
          ref={menuRef}
          className="dropdown-menu animate-pop-in"
          style={{ top: '48px', right: '12px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="dropdown-item"
            onClick={() => {
              setShowMenu(false);
              togglePin(chat.id, !chat.is_pinned);
            }}
          >
            <Pin size={15} /> {chat.is_pinned ? 'Unpin chat' : 'Pin chat'}
          </div>

          <div
            className="dropdown-item"
            onClick={() => {
              setShowMenu(false);
              toggleMute(chat.id, !chat.is_muted);
            }}
          >
            {chat.is_muted ? <Bell size={15} /> : <BellOff size={15} />}
            {chat.is_muted ? 'Unmute notifications' : 'Mute notifications'}
          </div>

          <div
            className="dropdown-item"
            onClick={() => {
              setShowMenu(false);
              toggleArchive(chat.id, !chat.is_archived);
            }}
          >
            <Archive size={15} /> {chat.is_archived ? 'Unarchive chat' : 'Archive chat'}
          </div>

          <div
            className="dropdown-item danger"
            onClick={() => {
              setShowMenu(false);
              onConfirmDelete(chat);
            }}
          >
            <Trash2 size={15} /> Delete conversation
          </div>
        </div>
      )}
    </li>
  );
};
