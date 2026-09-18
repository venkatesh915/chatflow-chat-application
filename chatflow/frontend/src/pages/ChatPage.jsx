import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { useChat } from '../context/ChatContext';

export const ChatPage = () => {
  const { activeChatId, selectChat } = useChat();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input-wrapper input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMobileChatActive = isMobile && !!activeChatId;

  return (
    <div className="chatflow-shell">
      <Sidebar isMobileChatActive={isMobileChatActive} />
      <ChatArea
        isMobileChatActive={isMobileChatActive}
        onMobileBack={() => selectChat(null)}
      />
    </div>
  );
};
