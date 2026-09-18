import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

export const ImageViewerModal = ({ src, alt = 'Image Preview', onClose }) => {
  if (!src) return null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = alt || 'chatflow-image.jpg';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div className="image-viewer-header" onClick={(e) => e.stopPropagation()}>
        <button
          className="icon-btn"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
          onClick={handleDownload}
          title="Download image"
        >
          <Download size={20} />
        </button>
        <button
          className="icon-btn"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
          onClick={onClose}
          title="Close (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      <img
        src={src}
        alt={alt}
        className="image-viewer-full animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
