import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

export const MessageList = ({
  messages,
  chatType,
  onReply,
  onImageClick,
  loading,
}) => {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll to bottom on messages load/change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background-color 0.5s ease';
      el.style.backgroundColor = 'rgba(0, 168, 132, 0.2)';
      setTimeout(() => {
        el.style.backgroundColor = 'transparent';
      }, 1500);
    }
  };

  // Group messages with date separators
  const renderMessagesWithSeparators = () => {
    const elements = [];
    let lastDateStr = null;

    const formatDateSeparator = (dateStr) => {
      const date = new Date(dateStr);
      const now = new Date();

      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) return 'Today';

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

      if (isYesterday) return 'Yesterday';

      return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
    };

    messages.forEach((msg) => {
      const dateStr = new Date(msg.created_at).toDateString();
      if (dateStr !== lastDateStr) {
        lastDateStr = dateStr;
        elements.push(
          <div key={`sep-${dateStr}`} className="date-separator">
            <span className="date-separator-badge">
              {formatDateSeparator(msg.created_at)}
            </span>
          </div>
        );
      }

      elements.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          chatType={chatType}
          onReply={onReply}
          onImageClick={onImageClick}
          onScrollToMessage={handleScrollToMessage}
        />
      );
    });

    return elements;
  };

  return (
    <div
      className="message-list-container"
      ref={containerRef}
      onScroll={handleScroll}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '14px',
          }}
        >
          No messages yet. Send a message to start the conversation!
        </div>
      ) : (
        renderMessagesWithSeparators()
      )}

      <div ref={bottomRef} style={{ height: '1px' }} />

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '24px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-modal)',
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 15,
            border: '1px solid var(--border-subtle)',
          }}
          title="Scroll to bottom"
        >
          <ChevronDown size={22} />
        </button>
      )}
    </div>
  );
};
