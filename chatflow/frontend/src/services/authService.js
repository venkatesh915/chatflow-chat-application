import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  async register(data) {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  async logout() {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put('/api/users/profile', data);
    return response.data;
  },

  async changePassword(current_password, new_password, confirm_new_password) {
    const response = await api.put('/api/users/password', {
      current_password,
      new_password,
      confirm_new_password
    });
    return response.data;
  },

  async searchUsers(query) {
    const response = await api.get('/api/users', {
      params: { q: query }
    });
    return response.data;
  },

  async getBlockedUsers() {
    const response = await api.get('/api/users/blocked/list');
    return response.data;
  },

  async blockUser(userId) {
    const response = await api.post(`/api/users/${userId}/block`);
    return response.data;
  },

  async unblockUser(userId) {
    const response = await api.delete(`/api/users/${userId}/block`);
    return response.data;
  },

  async getPrivacySettings() {
    const response = await api.get('/api/users/privacy');
    return response.data;
  },

  async updatePrivacySettings(data) {
    const response = await api.put('/api/users/privacy', data);
    return response.data;
  },

  async getUserProfile(userId) {
    const response = await api.get(`/api/users/${userId}/profile`);
    return response.data;
  }
};
