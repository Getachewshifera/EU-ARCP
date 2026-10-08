// Purpose: Client API calls for notifications.
import api from './api.js'

const notificationService = {
  list(params) {
    return api.get('/notifications', { params })
  },
  markRead(id) {
    return api.patch(`/notifications/${encodeURIComponent(id)}`, { read: true })
  },
  markAllRead() {
    return api.patch('/notifications/read-all')
  },
  remove(id) {
    return api.delete(`/notifications/${encodeURIComponent(id)}`)
  },
}

export default notificationService
