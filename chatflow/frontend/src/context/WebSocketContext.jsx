import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { resolveWsUrl } from '../utils/urlHelper';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  const addListener = useCallback((type, callback) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type).add(callback);

    return () => {
      if (listenersRef.current.has(type)) {
        listenersRef.current.get(type).delete(callback);
      }
    };
  }, []);

  const sendEvent = useCallback((type, payload = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, ...payload }));
    }
  }, []);

  const sendTyping = useCallback((chatId, isTyping) => {
    sendEvent(isTyping ? 'typing:start' : 'typing:stop', { chat_id: chatId });
  }, [sendEvent]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      setIsConnected(false);
      return;
    }

    let isMounted = true;

    const connect = () => {
      const wsUrl = resolveWsUrl(token);

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);

          // Start ping heartbeat
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type } = data;

            if (listenersRef.current.has(type)) {
              listenersRef.current.get(type).forEach((cb) => cb(data));
            }
            // Also notify wildcard listeners
            if (listenersRef.current.has('*')) {
              listenersRef.current.get('*').forEach((cb) => cb(data));
            }
          } catch (err) {
            // Ignore non-json
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

          // Attempt reconnection after 3 seconds
          if (isAuthenticated) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, 3000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        // Retry
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isAuthenticated, token]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        sendEvent,
        sendTyping,
        addListener,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  return context;
};
