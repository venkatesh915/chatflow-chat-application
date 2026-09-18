import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services/chatService';
import { useAuth } from './AuthContext';
import { useWebSocketContext } from './WebSocketContext';
import { useNotification } from './NotificationContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { addListener, sendTyping } = useWebSocketContext();
  const { playMessageSound, showDesktopNotification } = useNotification();

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { [chatId]: [ { userId, userName } ] }
  const [userPresence, setUserPresence] = useState({}); // { [userId]: { is_online, last_seen } }

  const activeChatIdRef = useRef(activeChatId);
  activeChatIdRef.current = activeChatId;

  // Load all chats
  const loadChats = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingChats(true);
    try {
      const data = await chatService.getChats();
      setChats(data);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoadingChats(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    } else {
      setChats([]);
      setActiveChatId(null);
      setMessages([]);
    }
  }, [isAuthenticated, loadChats]);

  // Load messages for a specific chat
  const loadMessages = useCallback(async (chatId, query = '') => {
    if (!chatId) return;
    setLoadingMessages(true);
    try {
      const msgs = await chatService.getMessages(chatId, query);
      setMessages(msgs);

      // Automatically mark chat as read
      await chatService.markChatRead(chatId).catch(() => {});
      // Decrement unread count locally in chat list
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const selectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
    if (chatId) {
      loadMessages(chatId);
    } else {
      setMessages([]);
    }
  }, [loadMessages]);

  // Send message
  const sendMessage = async ({ content, messageType = 'text', replyToId = null, fileData = null }) => {
    if (!activeChatId) return null;

    const payload = {
      chat_id: activeChatId,
      content,
      message_type: messageType,
      reply_to_id: replyToId,
      ...(fileData || {}),
    };

    try {
      const sentMsg = await chatService.sendMessage(payload);
      return sentMsg;
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    }
  };

  // Edit message
  const editMessage = async (messageId, newContent) => {
    try {
      const updated = await chatService.editMessage(messageId, newContent);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      return updated;
    } catch (err) {
      console.error('Failed to edit message:', err);
      throw err;
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_deleted: true, content: 'This message was deleted' }
            : m
        )
      );
    } catch (err) {
      console.error('Failed to delete message:', err);
      throw err;
    }
  };

  // Toggle reaction
  const toggleReaction = async (messageId, reaction) => {
    try {
      const updated = await chatService.toggleReaction(messageId, reaction);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      return updated;
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
      throw err;
    }
  };

  // Pin/Mute/Archive
  const togglePin = async (chatId, isPinned) => {
    await chatService.togglePin(chatId, isPinned);
    setChats((prev) => {
      const next = prev.map((c) => (c.id === chatId ? { ...c, is_pinned: isPinned } : c));
      next.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
      return next;
    });
  };

  const toggleMute = async (chatId, isMuted) => {
    await chatService.toggleMute(chatId, isMuted);
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, is_muted: isMuted } : c)));
  };

  const toggleArchive = async (chatId, isArchived) => {
    await chatService.toggleArchive(chatId, isArchived);
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, is_archived: isArchived } : c)));
  };

  const deleteChat = async (chatId) => {
    await chatService.deleteChat(chatId);
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setMessages([]);
    }
  };

  // WebSocket event subscriptions
  useEffect(() => {
    // 1. New Message
    const unsubNewMsg = addListener('message:new', (data) => {
      const { message } = data;
      if (!message) return;

      const isCurrentChat = activeChatIdRef.current === message.chat_id;
      const isFromMe = user && message.sender_id === user.id;

      if (isCurrentChat) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        if (!isFromMe) {
          // Play sound and mark read immediately
          playMessageSound();
          chatService.markChatRead(message.chat_id).catch(() => {});
        }
      } else {
        if (!isFromMe) {
          playMessageSound();
          showDesktopNotification(
            message.sender_name || 'New Message',
            message.content || 'Sent an attachment'
          );
        }
      }

      // Update chats list: update last_message, unread_count, and re-order
      setChats((prev) => {
        let chatExists = false;
        const next = prev.map((c) => {
          if (c.id === message.chat_id) {
            chatExists = true;
            return {
              ...c,
              last_message: message,
              updated_at: message.created_at,
              unread_count: isCurrentChat || isFromMe ? c.unread_count : c.unread_count + 1,
            };
          }
          return c;
        });

        if (!chatExists) {
          // If chat not in list yet, reload chats
          loadChats();
          return prev;
        }

        // Keep pinned at top, then sort by updated_at desc
        next.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
          return new Date(b.updated_at) - new Date(a.updated_at);
        });
        return next;
      });
    });

    // 2. Message Updated (edit or reaction)
    const unsubUpdateMsg = addListener('message:update', (data) => {
      const { message } = data;
      if (!message) return;

      if (activeChatIdRef.current === message.chat_id) {
        setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
      }

      setChats((prev) =>
        prev.map((c) => {
          if (c.last_message && c.last_message.id === message.id) {
            return { ...c, last_message: message };
          }
          return c;
        })
      );
    });

    // 3. Message Deleted
    const unsubDeleteMsg = addListener('message:delete', (data) => {
      const { message_id, chat_id } = data;
      if (activeChatIdRef.current === chat_id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message_id
              ? { ...m, is_deleted: true, content: 'This message was deleted' }
              : m
          )
        );
      }
    });

    // 4. Message Delivered Receipts
    const unsubDeliveredReceipt = addListener('message:delivered', (data) => {
      const { message_ids } = data;
      if (!message_ids || !message_ids.length) return;

      const idSet = new Set(message_ids);
      setMessages((prev) =>
        prev.map((m) =>
          idSet.has(m.id) && m.status === 'sent'
            ? { ...m, status: 'delivered' }
            : m
        )
      );

      setChats((prev) =>
        prev.map((c) => {
          if (c.last_message && idSet.has(c.last_message.id) && c.last_message.status === 'sent') {
            return {
              ...c,
              last_message: { ...c.last_message, status: 'delivered' }
            };
          }
          return c;
        })
      );
    });

    // 4b. Message Read Receipts
    const unsubReadReceipt = addListener('message:read', (data) => {
      const { chat_id, last_read_message_id } = data;
      if (activeChatIdRef.current === chat_id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id <= last_read_message_id && m.sender_id === user?.id
              ? { ...m, status: 'read' }
              : m
          )
        );
      }

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === chat_id && c.last_message && c.last_message.id <= last_read_message_id && c.last_message.sender_id === user?.id) {
            return {
              ...c,
              last_message: { ...c.last_message, status: 'read' }
            };
          }
          return c;
        })
      );
    });

    // 5. Typing Indicator
    const unsubTyping = addListener('typing:update', (data) => {
      const { chat_id, user_id, user_name, is_typing } = data;
      setTypingUsers((prev) => {
        const currentList = prev[chat_id] || [];
        if (is_typing) {
          if (currentList.some((u) => u.userId === user_id)) return prev;
          return {
            ...prev,
            [chat_id]: [...currentList, { userId: user_id, userName: user_name }],
          };
        } else {
          return {
            ...prev,
            [chat_id]: currentList.filter((u) => u.userId !== user_id),
          };
        }
      });
    });

    // 6. User Presence (Online / Last Seen)
    const unsubPresence = addListener('user:presence', (data) => {
      const { user_id, is_online, last_seen } = data;
      setUserPresence((prev) => ({
        ...prev,
        [user_id]: { is_online, last_seen },
      }));

      // Update in chats list
      setChats((prev) =>
        prev.map((c) => {
          if (c.other_user && c.other_user.id === user_id) {
            return {
              ...c,
              other_user: {
                ...c.other_user,
                is_online,
                last_seen,
              },
            };
          }
          return c;
        })
      );
    });

    // 7. Chat Created / Updated
    const unsubChatCreated = addListener('chat:created', (data) => {
      const { chat } = data;
      if (chat) {
        setChats((prev) => {
          if (prev.some((c) => c.id === chat.id)) return prev;
          return [chat, ...prev];
        });
      }
    });

    const unsubChatUpdated = addListener('chat:updated', (data) => {
      const { chat } = data;
      if (chat) {
        setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, ...chat } : c)));
      }
    });

    return () => {
      unsubNewMsg();
      unsubUpdateMsg();
      unsubDeleteMsg();
      unsubDeliveredReceipt();
      unsubReadReceipt();
      unsubTyping();
      unsubPresence();
      unsubChatCreated();
      unsubChatUpdated();
    };
  }, [addListener, user, playMessageSound, showDesktopNotification, loadChats]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        activeChat,
        messages,
        loadingChats,
        loadingMessages,
        typingUsers,
        userPresence,
        loadChats,
        loadMessages,
        selectChat,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        togglePin,
        toggleMute,
        toggleArchive,
        deleteChat,
        sendTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
