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

  getUsers(params) {
    return api.get('/users', { params })
  },

  updateUser(id, updates) {
    return api.patch(`/users/${encodeURIComponent(id)}`, updates)
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

  updateMaterial(id, updates) {
    return api.patch(`/materials/${encodeURIComponent(id)}`, updates)
  },

  getReports(params) {
    return api.get('/reports', { params })
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
