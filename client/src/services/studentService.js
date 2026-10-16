import api from './api.js'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')

// Convert a stored profilePhoto filename to a full URL
export function getAvatarUrl(profilePhoto) {
  if (!profilePhoto) return ''
  if (profilePhoto.startsWith('http')) return profilePhoto
  return `${API_BASE}/avatars/${profilePhoto}`
}

const byId = (path, id) => `${path}/${encodeURIComponent(id)}`
const studentService = {
  getDashboard: () => api.get('/student/dashboard'),
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  listUniversities: () => api.get('/universities'),
  listColleges: (university) => api.get('/academic/colleges', { params: { university } }),
  listDepartments: (college) => api.get('/academic/departments', { params: { college } }),
  listPrograms: (department) => api.get('/academic/programs', { params: { department } }),
  changePassword: (data) => api.patch('/users/me/password', data),
  listMaterials: (params) => api.get('/materials', { params }),
  getMyMaterials: (params) => api.get('/materials/mine', { params }),
  uploadMaterial: (formData) => api.post('/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMaterial: (id) => api.get(byId('/materials', id)),
  listGroups: (params) => api.get('/groups', { params }),
  createGroup: (data) => api.post('/groups', data),
  getGroup: (id) => api.get(byId('/groups', id)),
  updateGroup: (id, data) => api.patch(byId('/groups', id), data),
  deleteGroup: (id) => api.delete(byId('/groups', id)),
  updateGroupAdmin: (id, userId, isAdmin) => api.patch(byId('/groups', id) + '/admins', { userId, isAdmin }),
  inviteGroupMember: (id, email) => api.post(byId('/groups', id) + '/members/invite', { email }),
  joinGroup: (id) => api.post(byId('/groups', id) + '/members'),
  leaveGroup: (id) => api.delete(byId('/groups', id) + '/members/me'),
  listNotifications: (params) => api.get('/notifications', { params }),
  markNotificationRead: (id) => api.patch(byId('/notifications', id), { read: true }),
  listConversations: (params) => api.get('/private-messages/conversations', { params }),
  listMessages: (conversationId) => api.get(byId('/private-messages/conversations', conversationId)),
  sendMessage: (conversationId, data) => api.post(byId('/private-messages/conversations', conversationId), data),
  uploadPhoto: (formData) => api.patch('/users/me/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}


export default studentService
