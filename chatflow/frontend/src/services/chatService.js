import api from './api';

export const chatService = {
  async getChats() {
    const response = await api.get('/api/chats');
    return response.data;
  },

  async getChatById(chatId) {
    const response = await api.get(`/api/chats/${chatId}`);
    return response.data;
  },

  async createDirectChat(targetUserId) {
    const response = await api.post('/api/chats', { target_user_id: targetUserId });
    return response.data;
  },

  async deleteChat(chatId) {
    const response = await api.delete(`/api/chats/${chatId}`);
    return response.data;
  },

  async togglePin(chatId, isPinned) {
    const response = await api.put(`/api/chats/${chatId}/pin`, { is_pinned: isPinned });
    return response.data;
  },

  async toggleMute(chatId, isMuted) {
    const response = await api.put(`/api/chats/${chatId}/mute`, { is_muted: isMuted });
    return response.data;
  },

  async toggleArchive(chatId, isArchived) {
    const response = await api.put(`/api/chats/${chatId}/archive`, { is_archived: isArchived });
    return response.data;
  },

  async markChatRead(chatId) {
    const response = await api.post(`/api/chats/${chatId}/read`);
    return response.data;
  },

  // Messages
  async getMessages(chatId, searchQuery = '') {
    const params = searchQuery ? { q: searchQuery } : {};
    const response = await api.get(`/api/messages/${chatId}`, { params });
    return response.data;
  },

  async sendMessage(messageData) {
    const response = await api.post('/api/messages', messageData);
    return response.data;
  },

  async editMessage(messageId, content) {
    const response = await api.put(`/api/messages/${messageId}`, { content });
    return response.data;
  },

  async deleteMessage(messageId) {
    const response = await api.delete(`/api/messages/${messageId}`);
    return response.data;
  },

  async toggleReaction(messageId, reaction) {
    const response = await api.post(`/api/messages/${messageId}/reaction`, { reaction });
    return response.data;
  },

  // Groups
  async createGroup(data) {
    const response = await api.post('/api/groups', data);
    return response.data;
  },

  async updateGroup(groupId, data) {
    const response = await api.put(`/api/groups/${groupId}`, data);
    return response.data;
  },

  async addGroupMember(groupId, userId) {
    const response = await api.post(`/api/groups/${groupId}/members`, { user_id: userId });
    return response.data;
  },

  async removeGroupMember(groupId, userId) {
    const response = await api.delete(`/api/groups/${groupId}/members/${userId}`);
    return response.data;
  },

  async leaveGroup(groupId) {
    const response = await api.post(`/api/groups/${groupId}/leave`);
    return response.data;
  }
};
