import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({ searchTerm, onSearchChange, activeFilter, onFilterChange }) => {
  return (
    <div className="sidebar-search-container">
      <div className="search-input-wrapper">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search or start new chat"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            style={{ color: 'var(--text-muted)', padding: '2px' }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          All
        </button>
        <button
          className={`filter-pill ${activeFilter === 'unread' ? 'active' : ''}`}
          onClick={() => onFilterChange('unread')}
        >
          Unread
        </button>
        <button
          className={`filter-pill ${activeFilter === 'groups' ? 'active' : ''}`}
          onClick={() => onFilterChange('groups')}
        >
          Groups
        </button>
      </div>
    </div>
  );
};
