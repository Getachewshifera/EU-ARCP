// Purpose: Client API calls for groups and memberships.
import api from './api.js'

const groupPath = '/groups'
const byId = (id) => `${groupPath}/${encodeURIComponent(id)}`
const groupService = {
  list(params) {
    return api.get(groupPath, { params })
  },
  get(id) {
    return api.get(byId(id))
  },
  create(data) {
    return api.post(groupPath, data)
  },
  update(id, data) {
    return api.patch(byId(id), data)
  },
  remove(id) {
    return api.delete(byId(id))
  },
  join(id) {
    return api.post(`${byId(id)}/members`)
  },
  leave(id) {
    return api.delete(`${byId(id)}/members/me`)
  },
  listMembers(id, params) {
    return api.get(`${byId(id)}/members`, { params })
  },
}

export default groupService
