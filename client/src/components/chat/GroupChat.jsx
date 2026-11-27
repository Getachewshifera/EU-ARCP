// Purpose: Paginated group conversation with live messages, replies, and moderation.
import { useCallback, useEffect, useRef, useState } from 'react'
import chatService from '../../services/chatService.js'
import useAuth from '../../hooks/useAuth.js'
import useLanguage from '../../hooks/useLanguage.js'
import useSocket from '../../hooks/useSocket.js'
import ChatWindow from './ChatWindow.jsx'

const PAGE_SIZE = 50

function GroupChat({ groupId, group, canModerate = false }) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const socket = useSocket()
  const userId = String(user?._id || user?.id || '')
  const [messages, setMessages] = useState([])
  const [attachmentUrls, setAttachmentUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [draft, setDraft] = useState('')
  const [file, setFile] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [typingNames, setTypingNames] = useState({})
  const typingTimer = useRef(null)
  const typingActive = useRef(false)
  const requestedImages = useRef(new Set())

  const loadMessages = useCallback(async (beforeId) => {
    const response = await chatService.listGroupMessages(groupId, {
      limit: PAGE_SIZE,
      ...(beforeId ? { beforeId } : {}),
    })
    return response.data || {}
  }, [groupId])

  useEffect(() => {
    let active = true
    void loadMessages()
      .then((result) => {
        if (!active) return
        setMessages(result.items || [])
        setHasMore(result.hasMore === true)
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || requestError.message || t('Unable to load group messages.'))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [loadMessages, t])

  useEffect(() => {
    messages.forEach((message) => {
      (message.attachments || []).forEach((attachment, index) => {
        if (!attachment.mimeType?.startsWith('image/')) return
        const key = `${message._id}:${index}`
        if (requestedImages.current.has(key)) return
        requestedImages.current.add(key)
        void chatService.getGroupMessageAttachment(groupId, message._id, index)
          .then((response) => {
            const url = response.data?.url
            if (!url) throw new Error(t('The server did not return a secure photo link.'))
            setAttachmentUrls((current) => ({ ...current, [key]: url }))
          })
          .catch((requestError) => {
            requestedImages.current.delete(key)
            setError(requestError.response?.data?.message || requestError.message || t('Unable to load this photo.'))
          })
      })
    })
  }, [groupId, messages, t])

  useEffect(() => {
    if (!groupId) return undefined
    socket.emit('group:join', { groupId }, (result) => {
      if (result?.error) setError(t(result.error))
    })
    return () => {
      window.clearTimeout(typingTimer.current)
      if (typingActive.current) socket.emit('group:typing', { groupId, typing: false })
      typingActive.current = false
      socket.emit('group:leave', { groupId })
    }
  }, [groupId, socket, t])

  useEffect(() => {
    function onMessage(message) {
      if (String(message.group) !== String(groupId)) return
      setMessages((current) => current.some((item) => String(item._id) === String(message._id))
        ? current.map((item) => String(item._id) === String(message._id) ? message : item)
        : [...current, message])
    }
    function onDeleted(message) {
      if (String(message.group) !== String(groupId)) return
      setMessages((current) => current.map((item) => String(item._id) === String(message._id)
        ? { ...item, body: '', attachments: [], deletedAt: message.deletedAt || new Date().toISOString() }
        : item))
    }
    function onReaction(message) {
      if (String(message.group) !== String(groupId)) return
      setMessages((current) => current.map((item) => String(item._id) === String(message._id) ? message : item))
    }
    function onTyping(event) {
      if (String(event.groupId) !== String(groupId) || String(event.userId) === userId) return
      setTypingNames((current) => {
        const next = { ...current }
        if (event.typing) next[event.userId] = event.name
        else delete next[event.userId]
        return next
      })
    }
    function onRemoved(event) {
      if (String(event.groupId) !== String(groupId) || String(event.userId) !== userId) return
      setError(t('You were removed from this group.'))
      socket.emit('group:leave', { groupId })
    }
    function onGroupDeleted(event) {
      if (String(event.groupId) === String(groupId)) setError(t('This group has been deleted.'))
    }
    function onSocketError(socketError) {
      setError(socketError?.message || t('The real-time chat connection failed.'))
    }
    function onChatError(payload) {
      setError(payload?.message || t('A real-time chat operation failed.'))
    }
    socket.on('group:message', onMessage)
    socket.on('group:message-deleted', onDeleted)
    socket.on('group:message-reaction', onReaction)
    socket.on('group:typing', onTyping)
    socket.on('group:member-removed', onRemoved)
    socket.on('group:deleted', onGroupDeleted)
    socket.on('connect_error', onSocketError)
    socket.on('chat:error', onChatError)
    return () => {
      socket.off('group:message', onMessage)
      socket.off('group:message-deleted', onDeleted)
      socket.off('group:message-reaction', onReaction)
      socket.off('group:typing', onTyping)
      socket.off('group:member-removed', onRemoved)
      socket.off('group:deleted', onGroupDeleted)
      socket.off('connect_error', onSocketError)
      socket.off('chat:error', onChatError)
    }
  }, [groupId, socket, t, userId])

  function updateTyping(isTyping) {
    window.clearTimeout(typingTimer.current)
    if (isTyping) {
      if (!typingActive.current) {
        socket.emit('group:typing', { groupId, typing: true })
        typingActive.current = true
      }
      typingTimer.current = window.setTimeout(() => {
        socket.emit('group:typing', { groupId, typing: false })
        typingActive.current = false
      }, 1200)
    } else if (typingActive.current) {
      socket.emit('group:typing', { groupId, typing: false })
      typingActive.current = false
    }
  }

  async function send(event) {
    event.preventDefault()
    if (!draft.trim() && !file) return
    if (file && file.size > 20 * 1024 * 1024) {
      setError(t('Chat attachments must be 20 MB or smaller.'))
      return
    }
    const data = new FormData()
    data.append('body', draft)
    if (file) data.append('attachment', file)
    if (replyTo?._id) data.append('replyTo', replyTo._id)
    setSending(true)
    setError('')
    try {
      const response = await chatService.sendGroupMessage(groupId, data)
      const item = response.data?.item
      if (item) setMessages((current) => current.some((message) => String(message._id) === String(item._id))
        ? current.map((message) => String(message._id) === String(item._id) ? item : message)
        : [...current, item])
      setDraft('')
      setFile(null)
      setReplyTo(null)
      if (typingActive.current) socket.emit('group:typing', { groupId, typing: false })
      typingActive.current = false
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to send this message.'))
    } finally {
      setSending(false)
    }
  }

  async function loadOlder() {
    if (!messages.length || loadingOlder) return
    setLoadingOlder(true)
    try {
      const result = await loadMessages(messages[0]._id)
      setMessages((current) => [...(result.items || []), ...current])
      setHasMore(result.hasMore === true)
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to load older messages.'))
    } finally {
      setLoadingOlder(false)
    }
  }

  async function deleteMessage(message) {
    if (!window.confirm(t('Delete this message?'))) return
    try {
      await chatService.deleteGroupMessage(groupId, message._id)
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to delete this message.'))
    }
  }

  async function reactToMessage(message, emoji) {
    try {
      const response = await chatService.reactToGroupMessage(groupId, message._id, emoji)
      const item = response.data?.item
      if (item) setMessages((current) => current.map((entry) => String(entry._id) === String(item._id) ? item : entry))
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to add this reaction.'))
    }
  }

  async function downloadAttachment(message, index) {
    const downloadWindow = window.open('about:blank', '_blank')
    if (!downloadWindow) {
      setError(t('Allow pop-ups to open the secure attachment link.'))
      return
    }
    try {
      const response = await chatService.getGroupMessageAttachment(groupId, message._id, index)
      if (!response.data?.url) throw new Error(t('The server did not return a secure download link.'))
      downloadWindow.opener = null
      downloadWindow.location.href = response.data.url
    } catch (requestError) {
      downloadWindow.close()
      setError(requestError.response?.data?.message || requestError.message || t('Unable to download this attachment.'))
    }
  }

  const typingLabel = Object.values(typingNames).length
    ? `${Object.values(typingNames).join(', ')} ${t('is typing…')}`
    : ''

  return (
    <section className="mt-4" aria-labelledby="group-chat-heading">
      <h2 className="h5 mb-3" id="group-chat-heading">{t('Group chat')} · {group?.name || group?.title || ''}</h2>
      {error && <div className="alert alert-danger" role="alert">{t(error)}</div>}
      {replyTo && (
        <div className="alert alert-secondary d-flex justify-content-between align-items-center gap-2 py-2 mb-2">
          <span className="text-truncate">{t('Replying to')}: {replyTo.body || t('Attachment')}</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setReplyTo(null)} type="button">{t('Cancel')}</button>
        </div>
      )}
      {loading
        ? <div className="text-secondary text-center p-5" role="status">{t('Loading messages…')}</div>
        : <ChatWindow
          canModerate={canModerate || user?.role === 'admin'}
          currentUserId={userId}
          appearance="group"
          attachmentUrls={attachmentUrls}
          attachmentAccept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.ppt,.pptx"
          attachmentHint="Attach an image or PDF, DOC, DOCX, PPT or PPTX file up to 20 MB."
          attachmentLabel="Attach file"
          disabled={!groupId}
          draft={draft}
          file={file}
          hasMore={hasMore}
          loadingMore={loadingOlder}
          messages={messages}
          onClearFile={() => setFile(null)}
          onDelete={deleteMessage}
          onDownload={downloadAttachment}
          onDraftChange={setDraft}
          onFileChange={setFile}
          onLoadOlder={loadOlder}
          onReply={setReplyTo}
          onReact={reactToMessage}
          onSubmit={send}
          onTyping={updateTyping}
          sending={sending}
          title={group?.name || group?.title || t('Group chat')}
          typingLabel={typingLabel}
        />}
    </section>
  )
}

export default GroupChat
