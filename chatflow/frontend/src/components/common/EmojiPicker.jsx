import React, { useState } from 'react';
import { Smile, Heart, ThumbsUp, Coffee, Sun, Lightbulb, Search } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖',
      '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
      '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔'
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '🖕', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙',
      '💪', '🙏', '👏', '🙌', '👐', '🤲', '🤝', '🤛', '🤜', '👊'
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌',
      '🔥', '✨', '🌟', '💫', '💥', '💯', '💢', '💨', '💤', '🎉'
    ]
  },
  {
    id: 'food',
    name: 'Food',
    icon: Coffee,
    emojis: [
      '☕', '🍵', '🧃', '🥤', '🍺', '🍻', '🍷', '🍕', '🍔', '🍟',
      '🌭', '🍿', '🧂', '🥓', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐',
      '🥖', '🥨', '🧀', '🥗', '🥣', '🍲', '🍜', '🍱', '🍙', '🍣'
    ]
  },
  {
    id: 'objects',
    name: 'Objects',
    icon: Lightbulb,
    emojis: [
      '💡', '🔦', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '📷', '📹',
      '🎥', '📞', '📟', '📠', '📺', '📻', '🎙️', '⏱️', '⏰', '⌛',
      '🔑', '🔒', '🔓', '🔨', '🛠️', '🔧', '📦', '🏷️', '✉️', '📎'
    ]
  }
];

export const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState('smileys');
  const [searchTerm, setSearchTerm] = useState('');

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '64px',
        left: '16px',
        width: '320px',
        height: '340px',
        backgroundColor: 'var(--bg-modal)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      className="animate-pop-in"
    >
      {/* Search Input */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 8px',
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search emoji..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-sidebar-header)',
        }}
      >
        {EMOJI_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderBottom: isActive ? '2px solid var(--brand-primary)' : '2px solid transparent',
                color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
              }}
              title={cat.name}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>

      {/* Emojis Grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
        }}
      >
        {(searchTerm
          ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
          : currentCategory.emojis
        ).map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onSelect(emoji);
            }}
            style={{
              fontSize: '22px',
              padding: '4px',
              borderRadius: '6px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
