import api from './api.js'

const byId = (path, id) => `${path}/${encodeURIComponent(id)}`
const studentService = {
  getDashboard: () => api.get('/student/dashboard'),
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  changePassword: (data) => api.patch('/users/me/password', data),
  listMaterials: (params) => api.get('/materials', { params }),
  getMyMaterials: (params) => api.get('/materials/mine', { params }),
  uploadMaterial: (formData) => api.post('/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMaterial: (id) => api.get(byId('/materials', id)),
  listGroups: (params) => api.get('/groups', { params }),
  getGroup: (id) => api.get(byId('/groups', id)),
  updateGroup: (id, data) => api.patch(byId('/groups', id), data),
  joinGroup: (id) => api.post(byId('/groups', id) + '/members'),
  leaveGroup: (id) => api.delete(byId('/groups', id) + '/members/me'),
  listNotifications: (params) => api.get('/notifications', { params }),
  markNotificationRead: (id) => api.patch(byId('/notifications', id), { read: true }),
  listConversations: (params) => api.get('/private-messages/conversations', { params }),
  listMessages: (conversationId) => api.get(byId('/private-messages/conversations', conversationId)),
  sendMessage: (conversationId, data) => api.post(byId('/private-messages/conversations', conversationId), data),
}

export default studentService
