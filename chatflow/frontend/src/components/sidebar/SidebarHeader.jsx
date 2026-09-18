import React, { useState, useRef, useEffect } from 'react';
import { MessageSquarePlus, Users, Settings, MoreVertical, LogOut, User, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';

export const SidebarHeader = ({ onOpenProfile, onOpenNewChat, onOpenNewGroup, onOpenSettings }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  return (
    <header className="sidebar-header">
      {/* Current User Avatar */}
      <Avatar
        src={user?.profile_image}
        name={user?.name}
        size="md"
        onClick={onOpenProfile}
        className="cursor-pointer"
      />

      {/* Header Actions */}
      <div className="sidebar-header-actions" ref={menuRef} style={{ position: 'relative' }}>
        {/* Theme Quick Toggle */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* New Group */}
        <button className="icon-btn" onClick={onOpenNewGroup} title="New Group">
          <Users size={20} />
        </button>

        {/* New Chat */}
        <button className="icon-btn" onClick={onOpenNewChat} title="New Chat">
          <MessageSquarePlus size={20} />
        </button>

        {/* More Options Dropdown */}
        <button
          className={`icon-btn ${showMenu ? 'active' : ''}`}
          onClick={() => setShowMenu(!showMenu)}
          title="Menu"
        >
          <MoreVertical size={20} />
        </button>

        {showMenu && (
          <div className="dropdown-menu animate-pop-in">
            <div
              className="dropdown-item"
              onClick={() => {
                setShowMenu(false);
                onOpenProfile();
              }}
            >
              <User size={16} /> Profile
            </div>

            <div
              className="dropdown-item"
              onClick={() => {
                setShowMenu(false);
                onOpenNewGroup();
              }}
            >
              <Users size={16} /> New Group
            </div>

            <div
              className="dropdown-item"
              onClick={() => {
                setShowMenu(false);
                onOpenSettings();
              }}
            >
              <Settings size={16} /> Settings
            </div>

            <div
              className="dropdown-item danger"
              onClick={() => {
                setShowMenu(false);
                logout();
              }}
            >
              <LogOut size={16} /> Log Out
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
