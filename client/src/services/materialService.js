// Purpose: Client API calls for materials.
import api from './api.js'

const resourcePath = '/materials'
const byId = (id) => `${resourcePath}/${encodeURIComponent(id)}`

const materialService = {
  list(params) {
    return api.get(resourcePath, { params })
  },
  listCategories() {
    return api.get('/categories', { params: { limit: 500 } })
  },
  listUniversities() {
    return api.get('/universities', { params: { limit: 500 } })
  },
  listDepartments() {
    return api.get('/academic/departments', { params: { limit: 500 } })
  },
  get(id) {
    return api.get(byId(id))
  },
  listMine(params) {
    return api.get(`${resourcePath}/mine`, { params })
  },
  upload(formData, onUploadProgress) {
    return api.post(resourcePath, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total) onUploadProgress?.(Math.round((event.loaded * 100) / event.total))
      },
    })
  },
  getDownloadUrl(id) {
    return api.get(`${byId(id)}/download`)
  },
  getLegacyFile(id) {
    return api.get(`${byId(id)}/file`, { responseType: 'blob' })
  },
  update(id, data) {
    return api.patch(byId(id), data)
  },
  delete(id) {
    return api.delete(byId(id))
  },
}

export default materialService
