import React, { useState } from 'react';
import { MessageSquare, Lock, Search, X } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ImageViewerModal } from '../modals/ImageViewerModal';
import { ConfirmDialog } from '../modals/ConfirmDialog';
import { useChat } from '../../context/ChatContext';

export const ChatArea = ({ isMobileChatActive, onMobileBack }) => {
  const {
    activeChat,
    messages,
    loadingMessages,
    sendMessage,
    deleteChat,
    loadMessages,
  } = useChat();

  const [replyingTo, setReplyingTo] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // If no chat is selected, show standard WhatsApp-style empty greeting screen
  if (!activeChat) {
    return (
      <main className={`chat-area-panel ${!isMobileChatActive ? 'mobile-hidden' : ''}`}>
        <div className="chat-empty-state">
          <div className="chat-empty-icon animate-pop-in">
            <MessageSquare size={70} strokeWidth={1.5} />
          </div>
          <h1 className="chat-empty-title">ChatFlow Web</h1>
          <p className="chat-empty-desc">
            Send and receive messages without keeping your phone online.
            Use ChatFlow on up to 4 linked devices and 1 phone simultaneously.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '28px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <Lock size={13} />
            <span>End-to-end encrypted messaging</span>
          </div>
        </div>
      </main>
    );
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMessages(activeChat.id, searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadMessages(activeChat.id, '');
  };

  const handleClearChat = async () => {
    if (activeChat) {
      await deleteChat(activeChat.id);
      setClearConfirmOpen(false);
    }
  };

  return (
    <main className={`chat-area-panel ${!isMobileChatActive ? 'mobile-hidden' : ''}`}>
      {/* Background wallpaper pattern */}
      <div className="chat-wallpaper-bg" />

      {/* Header */}
      <ChatHeader
        chat={activeChat}
        onBack={onMobileBack}
        onToggleSearch={() => setShowSearch(!showSearch)}
        onOpenGroupInfo={() => {}}
        onConfirmClear={() => setClearConfirmOpen(true)}
      />

      {/* In-Chat Message Search Bar */}
      {showSearch && (
        <form
          onSubmit={handleSearchSubmit}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--bg-sidebar-header)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10,
          }}
          className="animate-fade-in"
        >
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search previous messages in this chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button type="button" onClick={handleClearSearch}>
                <X size={15} />
              </button>
            )}
          </div>
          <button type="button" className="icon-btn" onClick={() => setShowSearch(false)}>
            <X size={18} />
          </button>
        </form>
      )}

      {/* Message List */}
      <MessageList
        messages={messages}
        chatType={activeChat.type}
        loading={loadingMessages}
        onReply={(msg) => setReplyingTo(msg)}
        onImageClick={(src) => setLightboxSrc(src)}
      />

      {/* Composer */}
      <MessageInput
        chatId={activeChat.id}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSendMessage={sendMessage}
      />

      {/* Lightbox Modal */}
      <ImageViewerModal
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />

      {/* Confirm Clear / Delete Dialog */}
      <ConfirmDialog
        isOpen={clearConfirmOpen}
        title="Clear this chat?"
        message="Messages from this chat will be deleted for your account."
        confirmText="Clear Chat"
        isDanger={true}
        onConfirm={handleClearChat}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </main>
  );
};
