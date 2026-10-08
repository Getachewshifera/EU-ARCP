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
}

export default userService
