import React from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { ChatListItem } from './ChatListItem';

export const ChatList = ({
  chats,
  activeChatId,
  searchTerm,
  activeFilter,
  loading,
  onSelectChat,
  onConfirmDelete,
}) => {
  if (loading) {
    return (
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-active)',
                opacity: 0.6,
              }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ height: '14px', width: '60%', backgroundColor: 'var(--bg-active)', borderRadius: '4px' }} />
              <div style={{ height: '12px', width: '85%', backgroundColor: 'var(--bg-active)', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Filter chats
  const filtered = chats.filter((c) => {
    // Search match
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(term);
      const matchMsg = c.last_message?.content?.toLowerCase().includes(term);
      if (!matchName && !matchMsg) return false;
    }

    // Tab filter
    if (activeFilter === 'unread') {
      return c.unread_count > 0;
    }
    if (activeFilter === 'groups') {
      return c.type === 'group';
    }
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        {searchTerm ? (
          <>
            <Search size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <div style={{ fontSize: '15px', fontWeight: '500' }}>No chats found</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              No conversations matching "{searchTerm}"
            </div>
          </>
        ) : (
          <>
            <MessageSquare size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <div style={{ fontSize: '15px', fontWeight: '500' }}>No conversations yet</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              Start a new chat by clicking the new chat icon above!
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <ul className="chat-list">
      {filtered.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isActive={chat.id === activeChatId}
          onClick={() => onSelectChat(chat.id)}
          onConfirmDelete={onConfirmDelete}
        />
      ))}
    </ul>
  );
};
