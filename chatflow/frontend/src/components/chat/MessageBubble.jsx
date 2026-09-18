import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Reply, Edit3, Trash2, Copy, FileText, Download, Check, X } from 'lucide-react';
import { StatusTicks } from '../common/StatusTicks';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { resolveMediaUrl } from '../../utils/urlHelper';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '😡'];

export const MessageBubble = ({
  message,
  chatType,
  onReply,
  onImageClick,
  onScrollToMessage,
}) => {
  const { user } = useAuth();
  const { toggleReaction, editMessage, deleteMessage } = useChat();

  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowReactionPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOutgoing = message.sender_id === user?.id;
  const isDeleted = message.is_deleted;
  const isSystem = message.message_type === 'system';

  // System Message (Centered pill)
  if (isSystem) {
    return (
      <div className="system-message-row">
        <div className="system-message-bubble">
          {message.content}
        </div>
      </div>
    );
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
    setShowMenu(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await editMessage(message.id, editContent.trim());
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReactionClick = (emoji) => {
    toggleReaction(message.id, emoji);
    setShowReactionPicker(false);
  };

  // Check if current user reacted with any emoji
  const userReactions = message.reactions?.filter((r) => r.user_id === user?.id).map((r) => r.reaction) || [];

  return (
    <div
      id={`msg-${message.id}`}
      className={`message-row ${isOutgoing ? 'outgoing' : 'incoming'}`}
    >
      <div className="message-bubble" ref={menuRef}>
        {/* Sender name for group chats if incoming */}
        {!isOutgoing && chatType === 'group' && message.sender_name && (
          <div className="message-sender-title">{message.sender_name}</div>
        )}

        {/* Reply Preview Card */}
        {message.reply_preview && (
          <div
            className="reply-card"
            onClick={() => onScrollToMessage(message.reply_to_id)}
          >
            <div className="reply-sender">{message.reply_preview.sender_name}</div>
            <div className="reply-content">{message.reply_preview.content}</div>
          </div>
        )}

        {/* Attachments */}
        {message.attachments?.map((att) => {
          const fileUrl = resolveMediaUrl(att.file_url);
          const isImg =
            att.file_type.startsWith('image/') ||
            /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.file_name);

          if (isImg) {
            return (
              <img
                key={att.id}
                src={fileUrl}
                alt={att.file_name}
                className="message-image-thumb"
                onClick={() => onImageClick(fileUrl)}
              />
            );
          }

          const isAudio =
            message.message_type === 'voice' ||
            att.file_type.startsWith('audio/') ||
            /\.(webm|ogg|mp3|wav|m4a|opus)$/i.test(att.file_name);

          if (isAudio) {
            return (
              <VoiceMessagePlayer
                key={att.id}
                audioUrl={fileUrl}
                duration={att.duration || 0}
                isOutgoing={isOutgoing}
              />
            );
          }

          // Non-image, non-audio file card
          const fileSizeKb = Math.round(att.file_size / 1024);
          const sizeText = fileSizeKb > 1024 ? `${(fileSizeKb / 1024).toFixed(1)} MB` : `${fileSizeKb} KB`;

          return (
            <a
              key={att.id}
              href={fileUrl}
              download={att.file_name}
              target="_blank"
              rel="noreferrer"
              className="message-file-card"
            >
              <FileText size={28} color="var(--brand-primary)" />
              <div className="file-info">
                <div className="file-name">{att.file_name}</div>
                <div className="file-meta">{sizeText}</div>
              </div>
              <Download size={18} color="var(--text-muted)" />
            </a>
          );
        })}

        {/* Message Content or In-line Edit */}
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '4px 0' }}>
            <input
              type="text"
              className="form-input"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={() => setIsEditing(false)}
              >
                <X size={13} /> Cancel
              </button>
              <button
                className="btn-primary"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={handleSaveEdit}
              >
                <Check size={13} /> Save
              </button>
            </div>
          </div>
        ) : (
          (message.message_type !== 'voice' || message.content !== 'Voice message') && message.content && (
            <div className={`message-text ${isDeleted ? 'deleted' : ''}`}>
              {message.content}
            </div>
          )
        )}

        {/* Metadata: Time, Edited label, Status ticks */}
        <div className="message-meta">
          {message.is_edited && !isDeleted && (
            <span className="edited-tag">(edited)</span>
          )}
          <span>{formatTime(message.created_at)}</span>
          {isOutgoing && !isDeleted && (
            <StatusTicks status={message.status} size={15} />
          )}
        </div>

        {/* Reaction Pills below bubble */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="reaction-pills-row">
            {/* Group by reaction emoji */}
            {Object.entries(
              message.reactions.reduce((acc, r) => {
                acc[r.reaction] = (acc[r.reaction] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => {
              const isUser = userReactions.includes(emoji);
              return (
                <button
                  key={emoji}
                  className={`reaction-pill ${isUser ? 'user-reacted' : ''}`}
                  onClick={() => handleReactionClick(emoji)}
                  title={`Reacted ${count} time(s)`}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span style={{ fontSize: '11px', fontWeight: '600' }}>{count}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Hover Action Trigger (Chevron) */}
        {!isDeleted && (
          <button
            className="message-actions-trigger"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            title="Message options"
          >
            <ChevronDown size={14} />
          </button>
        )}

        {/* Quick Reaction Bar & Dropdown Menu */}
        {showMenu && (
          <div
            className="dropdown-menu animate-pop-in"
            style={{
              top: '28px',
              right: isOutgoing ? '0px' : 'auto',
              left: isOutgoing ? 'auto' : '0px',
              minWidth: '200px',
            }}
          >
            {/* Quick Emoji Reaction Pill bar */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                padding: '4px 6px 8px 6px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleReactionClick(emoji);
                    setShowMenu(false);
                  }}
                  style={{
                    fontSize: '18px',
                    padding: '3px',
                    borderRadius: '4px',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div
              className="dropdown-item"
              onClick={() => {
                setShowMenu(false);
                onReply(message);
              }}
            >
              <Reply size={15} /> Reply
            </div>

            <div className="dropdown-item" onClick={handleCopy}>
              <Copy size={15} /> Copy text
            </div>

            {isOutgoing && (
              <div
                className="dropdown-item"
                onClick={() => {
                  setShowMenu(false);
                  setIsEditing(true);
                  setEditContent(message.content || '');
                }}
              >
                <Edit3 size={15} /> Edit
              </div>
            )}

            {isOutgoing && (
              <div
                className="dropdown-item danger"
                onClick={() => {
                  setShowMenu(false);
                  deleteMessage(message.id);
                }}
              >
                <Trash2 size={15} /> Delete message
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
