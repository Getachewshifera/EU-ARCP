// Purpose: Client API calls for chat data.
import api from './api.js'

const conversations = '/private-messages/conversations'
const byId = (id) => `${conversations}/${encodeURIComponent(id)}`
const chatService = {
  listConversations(params) {
    return api.get(conversations, { params })
  },
  listMessages(conversationId, params) {
    return api.get(byId(conversationId), { params })
  },
  sendMessage(conversationId, data) {
    return api.post(byId(conversationId), data)
  },
  startConversation(data) {
    return api.post(conversations, data)
  },
  listGroupMessages(groupId, params) {
    return api.get(`/groups/${encodeURIComponent(groupId)}/messages`, { params })
  },
  sendGroupMessage(groupId, data) {
    return api.post(`/groups/${encodeURIComponent(groupId)}/messages`, data)
  },
}

export default chatService
