import React from 'react';
import { resolveMediaUrl } from '../../utils/urlHelper';

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 80,
  xxl: 110,
};

const colors = [
  '#00a884', '#008069', '#25d366', '#0288d1',
  '#7b1fa2', '#c2185b', '#e65100', '#455a64'
];

export const Avatar = ({
  src,
  name = '',
  size = 'md',
  isOnline = false,
  showOnline = false,
  onClick,
  className = '',
}) => {
  const pixelSize = sizeMap[size] || 40;
  const resolvedSrc = resolveMediaUrl(src);

  // Generate deterministic color based on name
  const getColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Get 1 or 2 letter initials
  const getInitials = (str) => {
    if (!str) return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={`avatar-wrapper ${className}`}
      style={{ width: pixelSize, height: pixelSize, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {src ? (
        <img
          src={resolvedSrc}
          alt={name}
          className="avatar-img"
          style={{ width: pixelSize, height: pixelSize }}
          onError={(e) => {
            e.target.style.display = 'none';
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
      ) : null}

      <div
        className="avatar-initials"
        style={{
          width: pixelSize,
          height: pixelSize,
          fontSize: pixelSize * 0.4,
          backgroundColor: getColor(name || 'ChatFlow'),
          display: src ? 'none' : 'flex',
        }}
      >
        {getInitials(name)}
      </div>

      {showOnline && isOnline && (
        <span
          className="avatar-online-dot"
          style={{
            width: Math.max(9, Math.round(pixelSize * 0.24)),
            height: Math.max(9, Math.round(pixelSize * 0.24)),
          }}
        />
      )}
    </div>
  );
};
