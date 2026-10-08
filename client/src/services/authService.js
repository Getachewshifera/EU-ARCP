// Purpose: Client API calls for authentication and registration.
import api from './api.js'

const authService = {
  login(credentials) {
    return api.post('/auth/login', credentials)
  },
  registerStudent(details) {
    return api.post('/auth/register/student', details)
  },
  registerLecturer(details) {
    return api.post('/auth/register/lecturer', details)
  },
  verifyOtp(data) {
    return api.post('/auth/verify-otp', data)
  },
  forgotPassword(data) {
    return api.post('/auth/forgot-password', data)
  },
  resetPassword(data) {
    return api.post('/auth/reset-password', data)
  },
  registrationStatus(params) {
    return api.get('/registrations/status', { params })
  },
  logout() {
    return api.post('/auth/logout')
  },
}

export default authService
