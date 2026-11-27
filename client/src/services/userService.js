// Purpose: Client API calls for user profiles and account data.
import api from './api.js'

const userService = {
  getCurrentUser() {
    return api.get('/users/me')
  },
  getProfile() {
    return api.get('/users/me')
  },
  updateProfile(data) {
    return api.patch('/users/me', data)
  },
  changePassword(data) {
    return api.patch('/users/me/password', data)
  },
  uploadPhoto(formData) {
    return api.patch('/users/me/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  listUniversities() {
    return api.get('/universities')
  },
  listColleges(university) {
    return api.get('/academic/colleges', { params: { university } })
  },
  listDepartments(college) {
    return api.get('/academic/departments', { params: { college } })
  },
  listPrograms(department) {
    return api.get('/academic/programs', { params: { department } })
  },
}

export default userService
