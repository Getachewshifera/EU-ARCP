// Purpose: Client API calls for reports.
import api from './api.js'

const reportService = {
  list(params) {
    return api.get('/reports', { params })
  },
  create(data) {
    return api.post('/reports', data)
  },
  get(id) {
    return api.get(`/reports/${encodeURIComponent(id)}`)
  },
}

export default reportService
