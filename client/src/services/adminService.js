// Purpose: Client API calls for administrative operations.
import api from './api.js'

const resourcePaths = {
  universities: '/universities',
  colleges: '/academic/colleges',
  departments: '/academic/departments',
  programs: '/academic/programs',
  courses: '/academic/courses',
  categories: '/categories',
  groups: '/groups',
  settings: '/settings',
  users: '/users',
}

function getResourcePath(resource) {
  const path = resourcePaths[resource]

  if (!path) {
    throw new Error(`Unsupported admin resource: ${resource}`)
  }

  return path
}

const adminService = {
  getDashboard() {
    return api.get('/admin/dashboard')
  },

  getPosts() {
    return api.get('/posts/admin')
  },

  createPost(data) {
    return api.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  updatePost(id, data) {
    return api.put(`/posts/${encodeURIComponent(id)}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  deletePost(id) {
    return api.delete(`/posts/${encodeURIComponent(id)}`)
  },

  getUsers(params) {
    return api.get('/users', { params })
  },

  updateUser(id, updates) {
    return api.patch(`/users/${encodeURIComponent(id)}`, updates)
  },

  deleteUser(id) {
    return api.delete(`/users/${encodeURIComponent(id)}`)
  },

  getRegistrationRequests(params) {
    return api.get('/registrations', { params })
  },

  reviewRegistration(id, status, note = '') {
    return api.patch(`/registrations/${encodeURIComponent(id)}`, { status, note })
  },

  getMaterials(params) {
    return api.get('/materials', { params })
  },

  async getMaterialFile(id) {
    const path = `/materials/${encodeURIComponent(id)}`
    const response = await api.get(`${path}/download`)
    const payload = response?.data?.data ?? response?.data
    if (payload?.legacy) return api.get(`${path}/file`, { responseType: 'blob' })
    if (!payload?.url) throw new Error('The server did not return a temporary download link.')
    const fileResponse = await fetch(payload.url)
    if (!fileResponse.ok) throw new Error('Unable to load the material file.')
    return { data: await fileResponse.blob() }
  },

  updateMaterial(id, updates) {
    return api.patch(`/materials/${encodeURIComponent(id)}`, updates)
  },

  deleteMaterial(id) {
    return api.delete(`/materials/${encodeURIComponent(id)}`)
  },

  getReports(params) {
    return api.get('/reports', { params })
  },

  getContactMessages(params) {
    return api.get('/admin/contact-messages', { params })
  },

  updateContactMessage(id, updates) {
    return api.patch(`/admin/contact-messages/${encodeURIComponent(id)}`, updates)
  },

  updateReport(id, updates) {
    return api.patch(`/reports/${encodeURIComponent(id)}`, updates)
  },

  getActivityLogs(params) {
    return api.get('/admin/activity-logs', { params })
  },

  listResource(resource, params) {
    return api.get(getResourcePath(resource), { params })
  },

  createResource(resource, values) {
    return api.post(getResourcePath(resource), values)
  },

  updateResource(resource, id, values) {
    return api.put(`${getResourcePath(resource)}/${encodeURIComponent(id)}`, values)
  },

  deleteResource(resource, id) {
    return api.delete(`${getResourcePath(resource)}/${encodeURIComponent(id)}`)
  },
}

export default adminService
