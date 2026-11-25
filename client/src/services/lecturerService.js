import api from './api.js'

const byId = (path, id) => `${path}/${encodeURIComponent(id)}`
const lecturerService = {
  getDashboard: () => api.get('/lecturer/dashboard'),
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  changePassword: (data) => api.patch('/users/me/password', data),
  listMaterials: (params) => api.get('/materials', { params }),
  getMyMaterials: (params) => api.get('/materials/mine', { params }),
  uploadMaterial: (formData, onUploadProgress) => api.post('/materials', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total) onUploadProgress?.(Math.round((event.loaded * 100) / event.total))
    },
  }),
  getMaterial: (id) => api.get(byId('/materials', id)),
  updateMaterial: (id, data) => api.patch(byId('/materials', id), data),
  deleteMaterial: (id) => api.delete(byId('/materials', id)),
  listGroups: (params) => api.get('/groups', { params }),
  getGroup: (id) => api.get(byId('/groups', id)),
  updateGroup: (id, data) => api.patch(byId('/groups', id), data),
  createGroup: (data) => api.post('/groups', data),
  deleteGroup: (id) => api.delete(byId('/groups', id)),
  listNotifications: (params) => api.get('/notifications', { params }),
  markNotificationRead: (id) => api.patch(byId('/notifications', id), { read: true }),
  listConversations: (params) => api.get('/private-messages/conversations', { params }),
  listMessages: (conversationId) => api.get(byId('/private-messages/conversations', conversationId)),
  sendMessage: (conversationId, data) => api.post(byId('/private-messages/conversations', conversationId), data),
}

export default lecturerService
