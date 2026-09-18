import React, { useState } from 'react';
import { SidebarHeader } from './SidebarHeader';
import { SearchBar } from './SearchBar';
import { ChatList } from './ChatList';
import { ProfileModal } from '../modals/ProfileModal';
import { NewChatModal } from '../modals/NewChatModal';
import { NewGroupModal } from '../modals/NewGroupModal';
import { SettingsModal } from '../modals/SettingsModal';
import { ConfirmDialog } from '../modals/ConfirmDialog';
import { useChat } from '../../context/ChatContext';

export const Sidebar = ({ isMobileChatActive }) => {
  const { chats, activeChatId, loadingChats, selectChat, deleteChat } = useChat();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Modal open states
  const [profileOpen, setProfileOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Delete chat confirmation state
  const [deleteTargetChat, setDeleteTargetChat] = useState(null);

  const handleConfirmDelete = async () => {
    if (deleteTargetChat) {
      await deleteChat(deleteTargetChat.id);
      setDeleteTargetChat(null);
    }
  };

  return (
    <aside className={`sidebar-panel ${isMobileChatActive ? 'mobile-hidden' : ''}`}>
      <SidebarHeader
        onOpenProfile={() => setProfileOpen(true)}
        onOpenNewChat={() => setNewChatOpen(true)}
        onOpenNewGroup={() => setNewGroupOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <ChatList
        chats={chats}
        activeChatId={activeChatId}
        searchTerm={searchTerm}
        activeFilter={activeFilter}
        loading={loadingChats}
        onSelectChat={selectChat}
        onConfirmDelete={(chat) => setDeleteTargetChat(chat)}
      />

      {/* Modals */}
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <NewChatModal isOpen={newChatOpen} onClose={() => setNewChatOpen(false)} />
      <NewGroupModal isOpen={newGroupOpen} onClose={() => setNewGroupOpen(false)} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <ConfirmDialog
        isOpen={!!deleteTargetChat}
        title="Delete Conversation?"
        message={`Are you sure you want to delete the chat with "${deleteTargetChat?.name}"? Messages will no longer be visible.`}
        confirmText="Delete"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetChat(null)}
      />
    </aside>
  );
};
