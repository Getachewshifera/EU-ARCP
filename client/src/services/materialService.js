// Purpose: Client API calls for materials.
import api from './api.js'

const resourcePath = '/materials'
const byId = (id) => `${resourcePath}/${encodeURIComponent(id)}`

const materialService = {
  list(params) {
    return api.get(resourcePath, { params })
  },
  get(id) {
    return api.get(byId(id))
  },
  listMine(params) {
    return api.get(`${resourcePath}/mine`, { params })
  },
  upload(formData) {
    return api.post(resourcePath, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  update(id, data) {
    return api.patch(byId(id), data)
  },
  delete(id) {
    return api.delete(byId(id))
  },
}

export default materialService
