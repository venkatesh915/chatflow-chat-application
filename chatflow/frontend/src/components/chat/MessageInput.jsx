import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, Mic, X, Image as ImageIcon, FileText } from 'lucide-react';
import { EmojiPicker } from '../common/EmojiPicker';
import { uploadService } from '../../services/uploadService';
import { useChat } from '../../context/ChatContext';
import { VoiceRecorder } from './VoiceRecorder';

export const MessageInput = ({
  chatId,
  replyingTo,
  onCancelReply,
  onSendMessage,
}) => {
  const { sendTyping } = useChat();

  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const textareaRef = useRef(null);
  const attachMenuRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e) => {
    setText(e.target.value);

    // Typing indicator
    if (!typingTimeoutRef.current) {
      sendTyping(chatId, true);
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(chatId, false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleSend = () => {
    if (!text.trim() || uploading) return;

    onSendMessage({
      content: text.trim(),
      messageType: 'text',
      replyToId: replyingTo?.id || null,
    });

    setText('');
    setShowEmoji(false);
    if (replyingTo) onCancelReply();

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    sendTyping(chatId, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setShowAttachMenu(false);

    try {
      const uploadRes = await uploadService.uploadFile(file);
      const isImg = file.type.startsWith('image/');

      await onSendMessage({
        content: isImg ? '' : file.name,
        messageType: isImg ? 'image' : 'file',
        replyToId: replyingTo?.id || null,
        fileData: {
          file_url: uploadRes.file_url,
          file_name: uploadRes.file_name,
          file_type: uploadRes.file_type,
          file_size: uploadRes.file_size,
        },
      });

      if (replyingTo) onCancelReply();
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setUploading(false);
      // Reset inputs
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVoiceSent = async (audioData) => {
    setIsRecordingVoice(false);
    try {
      await onSendMessage({
        content: 'Voice message',
        messageType: 'voice',
        replyToId: replyingTo?.id || null,
        fileData: {
          file_url: audioData.file_url,
          file_name: audioData.file_name,
          file_type: audioData.file_type,
          file_size: audioData.file_size,
          duration: audioData.duration,
        },
      });
      if (replyingTo) onCancelReply();
    } catch (err) {
      console.error('Failed to send voice message:', err);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="composer-reply-bar animate-fade-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: '600', color: 'var(--brand-primary)' }}>
              Replying to {replyingTo.sender_name || 'User'}
            </span>
            <span style={{ color: 'var(--text-secondary)', maxLines: 1, overflow: 'hidden' }}>
              {replyingTo.content || 'Attachment'}
            </span>
          </div>
          <button className="icon-btn" style={{ width: '28px', height: '28px' }} onClick={onCancelReply}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmoji && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmoji(false)}
        />
      )}

      {/* Attachment Popover */}
      {showAttachMenu && (
        <div className="attachment-menu-popover animate-pop-in" ref={attachMenuRef}>
          <label className="attach-option-btn">
            <ImageIcon size={18} color="#00a884" />
            <span>Photos & Videos</span>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e, 'image')}
            />
          </label>

          <label className="attach-option-btn">
            <FileText size={18} color="#53bdeb" />
            <span>Document</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.zip,.xlsx,.csv"
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e, 'document')}
            />
          </label>
        </div>
      )}

      {/* Input Composer Bar */}
      <div className="chat-composer-container">
        {isRecordingVoice ? (
          <VoiceRecorder
            onSendVoice={handleVoiceSent}
            onCancel={() => setIsRecordingVoice(false)}
          />
        ) : (
          <>
            {/* Emoji Button */}
            <button
              type="button"
              className={`icon-btn ${showEmoji ? 'active' : ''}`}
              onClick={() => setShowEmoji(!showEmoji)}
              title="Emoji"
            >
              <Smile size={22} />
            </button>

            {/* Attachment Button */}
            <button
              type="button"
              className={`icon-btn ${showAttachMenu ? 'active' : ''}`}
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              title="Attach"
            >
              <Paperclip size={22} />
            </button>

            {/* Text Input */}
            <div className="composer-input-wrapper">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Type a message..."
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Send / Mic Button */}
            {text.trim() || uploading ? (
              <button
                type="button"
                className="composer-send-btn"
                onClick={handleSend}
                disabled={uploading}
                title="Send message (Enter)"
              >
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                className="icon-btn"
                style={{ width: '42px', height: '42px', color: 'var(--brand-primary)' }}
                title="Hold or click to record voice message"
                onClick={() => setIsRecordingVoice(true)}
              >
                <Mic size={22} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
