import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Send, Mic } from 'lucide-react';
import api from '../../services/api';

export const VoiceRecorder = ({ onSendVoice, onCancel }) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    startRecording();

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Microphone recording is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please grant permission.');
      setTimeout(() => {
        onCancel();
      }, 2000);
    }
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const handleSend = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    setUploading(true);
    const duration = recordingTime;

    mediaRecorderRef.current.onstop = async () => {
      try {
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const audioFile = new File([audioBlob], `voice_${Date.now()}.${ext}`, { type: mimeType });

        const formData = new FormData();
        formData.append('file', audioFile);

        const uploadRes = await api.post('/api/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadRes.data && uploadRes.data.file_url) {
          onSendVoice({
            file_url: uploadRes.data.file_url,
            file_name: uploadRes.data.file_name || `voice_note.${ext}`,
            file_type: mimeType,
            file_size: uploadRes.data.file_size || audioBlob.size,
            duration: duration || 1
          });
        }
      } catch (err) {
        console.error('Failed to upload voice message:', err);
        setError('Failed to send voice recording.');
      } finally {
        cleanup();
      }
    };

    mediaRecorderRef.current.stop();
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '6px 12px',
        backgroundColor: 'var(--bg-input)',
        borderRadius: '24px',
        animation: 'fadeIn 0.2s ease-in-out'
      }}
    >
      {/* Recording Indicator & Timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#ea4335',
            boxShadow: '0 0 8px #ea4335',
            animation: 'pulse 1s infinite'
          }}
        />
        <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
          {formatTimer(recordingTime)}
        </span>
        {error ? (
          <span style={{ fontSize: '12px', color: 'var(--status-danger)' }}>{error}</span>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Recording audio...</span>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Cancel / Discard */}
        <button
          type="button"
          className="icon-btn"
          onClick={handleCancel}
          disabled={uploading}
          title="Discard recording"
          style={{ color: 'var(--status-danger)' }}
        >
          <Trash2 size={18} />
        </button>

        {/* Send */}
        <button
          type="button"
          onClick={handleSend}
          disabled={uploading || recordingTime < 1}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'var(--brand-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: uploading || recordingTime < 1 ? 'not-allowed' : 'pointer',
            opacity: recordingTime < 1 ? 0.6 : 1,
            transition: 'transform 0.15s ease'
          }}
          title="Send voice message"
        >
          {uploading ? (
            <span style={{ fontSize: '11px' }}>...</span>
          ) : (
            <Send size={16} style={{ transform: 'rotate(45deg)', margin: '-2px 0 0 -2px' }} />
          )}
        </button>
      </div>
    </div>
  );
};
