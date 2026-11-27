// Purpose: Client API calls for chat data.
import api from './api.js'

const conversations = '/private-messages/conversations'
const byId = (id) => `${conversations}/${encodeURIComponent(id)}`
const chatService = {
  searchUsers(search) {
    return api.get('/private-messages/users', { params: { search } })
  },
  listConversations(params) {
    return api.get(conversations, { params })
  },
  listMessages(conversationId, params) {
    return api.get(byId(conversationId), { params })
  },
  sendMessage(conversationId, data) {
    const config = typeof FormData !== 'undefined' && data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined
    return api.post(byId(conversationId), data, config)
  },
  deleteMessage(conversationId, messageId, scope = 'everyone') {
    return api.delete(`${byId(conversationId)}/${encodeURIComponent(messageId)}`, { params: { scope } })
  },
  deleteConversation(conversationId) {
    return api.delete(byId(conversationId))
  },
  setConversationPinned(conversationId, pinned) {
    return api.patch(`${byId(conversationId)}/preferences`, { pinned })
  },
  setConversationBlocked(conversationId, blocked) {
    return api.patch(`${byId(conversationId)}/block`, { blocked })
  },
  reactToMessage(conversationId, messageId, emoji) {
    return api.patch(`${byId(conversationId)}/${encodeURIComponent(messageId)}/reactions`, { emoji })
  },
  getMessageAttachment(conversationId, messageId, attachmentIndex) {
    return api.get(`${byId(conversationId)}/attachments/${encodeURIComponent(messageId)}/${attachmentIndex}`)
  },
  startConversation(data) {
    return api.post(conversations, data)
  },
  listGroupMessages(groupId, params) {
    return api.get(`/groups/${encodeURIComponent(groupId)}/messages`, { params })
  },
  sendGroupMessage(groupId, data) {
    const config = typeof FormData !== 'undefined' && data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined
    return api.post(`/groups/${encodeURIComponent(groupId)}/messages`, data, config)
  },
  deleteGroupMessage(groupId, messageId) {
    return api.delete(`/groups/${encodeURIComponent(groupId)}/messages/${encodeURIComponent(messageId)}`)
  },
  reactToGroupMessage(groupId, messageId, emoji) {
    return api.patch(`/groups/${encodeURIComponent(groupId)}/messages/${encodeURIComponent(messageId)}/reactions`, { emoji })
  },
  getGroupMessageAttachment(groupId, messageId, attachmentIndex) {
    return api.get(`/groups/${encodeURIComponent(groupId)}/messages/${encodeURIComponent(messageId)}/attachments/${attachmentIndex}`)
  },
  uploadGroupImage(groupId, data) {
    return api.patch(`/groups/${encodeURIComponent(groupId)}/image`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  removeGroupMember(groupId, userId) {
    return api.delete(`/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`)
  },
  updateGroupAdmin(groupId, userId, isAdmin) {
    return api.patch(`/groups/${encodeURIComponent(groupId)}/admins`, { userId, isAdmin })
  },
  inviteGroupMember(groupId, email) {
    return api.post(`/groups/${encodeURIComponent(groupId)}/members/invite`, { email })
  },
}

export default chatService
