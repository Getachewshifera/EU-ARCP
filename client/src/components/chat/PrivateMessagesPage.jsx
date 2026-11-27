// Purpose: Shared private conversation search, messaging, and live status UI.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import chatService from '../../services/chatService.js'
import { getAvatarUrl } from '../../services/studentService.js'
import useAuth from '../../hooks/useAuth.js'
import useLanguage from '../../hooks/useLanguage.js'
import useSocket from '../../hooks/useSocket.js'
import ChatWindow from './ChatWindow.jsx'

const PAGE_SIZE = 50

function displayName(user) {
  return user?.name || [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(' ') || user?.username || user?.email || 'User'
}

function conversationDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { weekday: 'short' })
}

function PrivateMessagesPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const socket = useSocket()
  const currentUserId = String(user?._id || user?.id || '')
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState('')
  const [messages, setMessages] = useState([])
  const [searchText, setSearchText] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')
  const [file, setFile] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [error, setError] = useState('')
  const [onlineUsers, setOnlineUsers] = useState({})
  const [typingName, setTypingName] = useState('')
  const typingTimer = useRef(null)
  const typingActive = useRef(false)

  const activeConversation = useMemo(
    () => conversations.find((conversation) => String(conversation.id || conversation._id) === activeId),
    [activeId, conversations],
  )
  const participant = activeConversation?.participant || activeConversation?.otherUser
  const participantId = String(participant?._id || participant?.id || '')

  const loadConversations = useCallback(async () => {
    try {
      const response = await chatService.listConversations()
      const items = response.data?.items || []
      setConversations(items)
      if (items.length === 0) {
        setMessages([])
        setHasMore(false)
      }
      setActiveId((current) => current && items.some((item) => String(item.id || item._id) === current)
        ? current
        : String(items[0]?.id || items[0]?._id || ''))
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to load conversations.'))
    } finally {
      setLoadingConversations(false)
    }
  }, [t])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadConversations() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadConversations])

  useEffect(() => {
    let active = true
    const search = searchText.trim()
    if (!search) return () => { active = false }
    const timer = window.setTimeout(async () => {
      try {
        const response = await chatService.searchUsers(search)
        if (active) setSearchResults(response.data?.items || [])
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || requestError.message || t('Unable to search users.'))
      } finally {
        if (active) setSearching(false)
      }
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [searchText, t])

  const loadMessages = useCallback(async (conversationId, beforeId) => {
    if (!conversationId) return
    const response = await chatService.listMessages(conversationId, {
      limit: PAGE_SIZE,
      ...(beforeId ? { beforeId } : {}),
    })
    return response.data || {}
  }, [])

  useEffect(() => {
    let active = true
    if (!activeId) return () => { active = false }
    const timer = window.setTimeout(() => {
      if (!active) return
      setLoadingMessages(true)
      setError('')
      void loadMessages(activeId)
        .then((result) => {
          if (!active) return
          setMessages(result.items || [])
          setHasMore(result.hasMore === true)
          setConversations((current) => current.map((conversation) =>
            String(conversation.id || conversation._id) === activeId
              ? { ...conversation, unreadCount: 0 }
              : conversation))
        })
        .catch((requestError) => {
          if (active) setError(requestError.response?.data?.message || requestError.message || t('Unable to load messages.'))
        })
        .finally(() => {
          if (active) setLoadingMessages(false)
        })
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [activeId, loadMessages, t])

  useEffect(() => {
    if (!activeId) return undefined
    socket.emit('conversation:join', { conversationId: activeId }, (result) => {
      if (result?.error) setError(t(result.error))
    })
    if (participantId) {
      socket.emit('presence:check', [participantId], (result) => {
        setOnlineUsers((current) => ({ ...current, [participantId]: result?.onlineUserIds?.includes(participantId) === true }))
      })
    }
    return () => {
      window.clearTimeout(typingTimer.current)
      if (typingActive.current) socket.emit('private:typing', { conversationId: activeId, typing: false })
      typingActive.current = false
      socket.emit('conversation:leave', { conversationId: activeId })
    }
  }, [activeId, participantId, socket, t])

  useEffect(() => {
    function onInitialPresence({ onlineUserIds = [] }) {
      setOnlineUsers(Object.fromEntries(onlineUserIds.map((id) => [String(id), true])))
    }
    function onPresenceUpdate({ userId: changedId, online }) {
      setOnlineUsers((current) => ({ ...current, [String(changedId)]: online === true }))
    }
    function onMessage(message) {
      const senderId = String(message.sender?._id || message.sender?.id || message.sender || '')
      if (senderId !== currentUserId) {
        socket.emit('private:delivered', {
          conversationId: message.conversationId,
          messageId: message._id,
        })
      }
      if (String(message.conversationId) === activeId) {
        setMessages((current) => current.some((item) => String(item._id) === String(message._id))
          ? current.map((item) => String(item._id) === String(message._id) ? message : item)
          : [...current, message])
      }
      void loadConversations()
    }
    function onReceipt(receipt) {
      if (String(receipt.conversationId) !== activeId) return
      const ids = new Set((receipt.messageIds || []).map(String))
      setMessages((current) => current.map((message) => ids.has(String(message._id))
        ? { ...message, [receipt.status === 'read' ? 'readAt' : 'deliveredAt']: receipt.at || new Date().toISOString() }
        : message))
    }
    function onDeleted(message) {
      setMessages((current) => current.map((item) => String(item._id) === String(message._id)
        ? { ...item, body: '', attachments: [], deletedAt: message.deletedAt || new Date().toISOString() }
        : item))
    }
    function onMessageHidden(event) {
      if (String(event.conversationId) !== activeId) return
      const messageId = event.messageId || event._id
      setMessages((current) => current.filter((item) => String(item._id) !== String(messageId)))
    }
    function onConversationHidden(event) {
      const conversationId = String(event.conversationId)
      setConversations((current) => current.filter((item) => String(item.id || item._id) !== conversationId))
      if (conversationId === activeId) {
        setActiveId('')
        setMessages([])
        setReplyTo(null)
        void loadConversations()
      }
    }
    function onReaction(message) {
      if (String(message.conversationId) !== activeId) return
      setMessages((current) => current.map((item) => String(item._id) === String(message._id) ? message : item))
    }
    function onBlocked(event) {
      const conversationId = String(event.conversationId)
      setConversations((current) => current.map((item) => String(item.id || item._id) === conversationId
        ? { ...item, blocked: event.blocked === true, blockedByMe: event.blockedByMe === true }
        : item))
    }
    function onTyping(event) {
      if (String(event.conversationId) !== activeId || String(event.userId) === currentUserId) return
      setTypingName(event.typing ? event.name : '')
    }
    function onSocketError(socketError) {
      setError(socketError?.message || t('The real-time chat connection failed.'))
    }
    function onChatError(payload) {
      setError(payload?.message || t('A real-time chat operation failed.'))
    }
    socket.on('presence:initial', onInitialPresence)
    socket.on('presence:update', onPresenceUpdate)
    socket.on('private:message', onMessage)
    socket.on('private:receipt', onReceipt)
    socket.on('private:deleted', onDeleted)
    socket.on('private:message-hidden', onMessageHidden)
    socket.on('private:conversation-hidden', onConversationHidden)
    socket.on('private:reaction', onReaction)
    socket.on('private:blocked', onBlocked)
    socket.on('private:typing', onTyping)
    socket.on('connect_error', onSocketError)
    socket.on('chat:error', onChatError)
    return () => {
      socket.off('presence:initial', onInitialPresence)
      socket.off('presence:update', onPresenceUpdate)
      socket.off('private:message', onMessage)
      socket.off('private:receipt', onReceipt)
      socket.off('private:deleted', onDeleted)
      socket.off('private:message-hidden', onMessageHidden)
      socket.off('private:conversation-hidden', onConversationHidden)
      socket.off('private:reaction', onReaction)
      socket.off('private:blocked', onBlocked)
      socket.off('private:typing', onTyping)
      socket.off('connect_error', onSocketError)
      socket.off('chat:error', onChatError)
    }
  }, [activeId, currentUserId, loadConversations, socket, t])

  function updateTyping(isTyping) {
    if (!activeId) return
    window.clearTimeout(typingTimer.current)
    if (isTyping) {
      if (!typingActive.current) {
        socket.emit('private:typing', { conversationId: activeId, typing: true })
        typingActive.current = true
      }
      typingTimer.current = window.setTimeout(() => {
        socket.emit('private:typing', { conversationId: activeId, typing: false })
        typingActive.current = false
      }, 1200)
    } else if (typingActive.current) {
      socket.emit('private:typing', { conversationId: activeId, typing: false })
      typingActive.current = false
    }
  }

  async function startConversation(target) {
    setError('')
    try {
      const response = await chatService.startConversation({ recipientId: target._id || target.id })
      const conversation = response.data?.item
      const id = String(conversation?.id || conversation?._id || '')
      if (!id) throw new Error(t('The server did not return a conversation.'))
      setConversations((current) => [conversation, ...current.filter((item) => String(item.id || item._id) !== id)])
      setReplyTo(null)
      setActiveId(id)
      setSearchText('')
      setSearchResults([])
      setSearching(false)
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to start a conversation.'))
    }
  }

  async function send(event) {
    event.preventDefault()
    if (!activeId || (!draft.trim() && !file)) return
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
      const response = await chatService.sendMessage(activeId, data)
      const item = response.data?.item
      if (item) {
        setMessages((current) => current.some((message) => String(message._id) === String(item._id))
          ? current.map((message) => String(message._id) === String(item._id) ? item : message)
          : [...current, item])
      }
      setDraft('')
      setFile(null)
      setReplyTo(null)
      if (typingActive.current) socket.emit('private:typing', { conversationId: activeId, typing: false })
      typingActive.current = false
      await loadConversations()
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
      const result = await loadMessages(activeId, messages[0]._id)
      setMessages((current) => [...(result.items || []), ...current])
      setHasMore(result.hasMore === true)
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to load older messages.'))
    } finally {
      setLoadingOlder(false)
    }
  }

  async function deleteMessageForMe(message) {
    if (!window.confirm(t('Remove this message from your view?'))) return
    try {
      await chatService.deleteMessage(activeId, message._id, 'me')
      setMessages((current) => current.filter((item) => String(item._id) !== String(message._id)))
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to remove this message.'))
    }
  }

  async function deleteMessageForEveryone(message) {
    if (!window.confirm(t('Delete this message for everyone? This cannot be undone.'))) return
    try {
      const response = await chatService.deleteMessage(activeId, message._id, 'everyone')
      const item = response.data?.item
      if (item) {
        setMessages((current) => current.map((entry) => String(entry._id) === String(item._id)
          ? { ...entry, body: '', attachments: [], reactions: [], deletedAt: item.deletedAt }
          : entry))
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to delete this message.'))
    }
  }

  async function reactToMessage(message, emoji) {
    try {
      const response = await chatService.reactToMessage(activeId, message._id, emoji)
      const item = response.data?.item
      if (item) setMessages((current) => current.map((entry) => String(entry._id) === String(item._id) ? item : entry))
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to add this reaction.'))
    }
  }

  async function removeConversation(conversation) {
    const conversationId = String(conversation.id || conversation._id)
    if (!window.confirm(t('Remove this conversation from your inbox? New messages can make it appear again.'))) return
    try {
      await chatService.deleteConversation(conversationId)
      setConversations((current) => current.filter((item) => String(item.id || item._id) !== conversationId))
      if (activeId === conversationId) {
        setActiveId('')
        setMessages([])
        setReplyTo(null)
        await loadConversations()
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to remove this conversation.'))
    }
  }

  async function togglePinned(conversation) {
    const conversationId = String(conversation.id || conversation._id)
    const pinned = !conversation.pinned
    try {
      await chatService.setConversationPinned(conversationId, pinned)
      setConversations((current) => current.map((item) => String(item.id || item._id) === conversationId
        ? { ...item, pinned }
        : item).sort((first, second) => Number(second.pinned) - Number(first.pinned)
          || new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()))
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to update the pinned conversation.'))
    }
  }

  async function toggleBlocked(blocked) {
    if (blocked && !window.confirm(t('Block this user? You will not be able to send messages until you unblock them.'))) return
    try {
      const response = await chatService.setConversationBlocked(activeId, blocked)
      setConversations((current) => current.map((item) => String(item.id || item._id) === activeId
        ? { ...item, blocked: response.data?.blocked === true, blockedByMe: response.data?.blockedByMe === true }
        : item))
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to update the block setting.'))
    }
  }

  async function downloadAttachment(message, index) {
    const downloadWindow = window.open('about:blank', '_blank')
    if (!downloadWindow) {
      setError(t('Allow pop-ups to open the secure attachment link.'))
      return
    }
    try {
      const response = await chatService.getMessageAttachment(activeId, message._id, index)
      if (!response.data?.url) throw new Error(t('The server did not return a secure download link.'))
      downloadWindow.opener = null
      downloadWindow.location.href = response.data.url
    } catch (requestError) {
      downloadWindow.close()
      setError(requestError.response?.data?.message || requestError.message || t('Unable to download this attachment.'))
    }
  }

  const online = onlineUsers[participantId] === true

  return (
    <section className="private-messages-page">
      <header className="mb-4">
        <h1 className="h3 mb-1">{t('Private messages')}</h1>
        <p className="text-secondary mb-0">{t('Find students and lecturers to start a private conversation.')}</p>
      </header>
      {error && <div className="alert alert-danger" role="alert">{t(error)}</div>}
      <div className="card overflow-hidden private-messages-card">
        <div className="row g-0 private-messages-layout" style={{ minHeight: '34rem' }}>
          <aside className="col-12 col-lg-4 col-xl-3 border-end private-messages-sidebar">
            <div className="p-3 border-bottom private-messages-search">
              <label className="visually-hidden" htmlFor="private-user-search">{t('Search students and lecturers')}</label>
              <input
                autoComplete="off"
                className="form-control"
                id="private-user-search"
                onChange={(event) => {
                  const value = event.target.value
                  setSearchText(value)
                  setSearchResults([])
                  setSearching(Boolean(value.trim()))
                }}
                placeholder={t('Search students and lecturers')}
                value={searchText}
              />
              {searching && <div className="small text-secondary mt-2" role="status">{t('Searching…')}</div>}
            </div>
            <div className="list-group list-group-flush overflow-auto private-messages-list" style={{ maxHeight: '30rem' }}>
              {searchText.trim() && searchResults.map((result) => {
                const id = String(result._id || result.id)
                return (
                  <button className="list-group-item list-group-item-action d-flex align-items-center gap-2 text-start" key={id} onClick={() => void startConversation(result)} type="button">
                    {result.profilePhoto
                      ? <img alt="" className="rounded-circle" height="38" src={getAvatarUrl(result.profilePhoto)} style={{ objectFit: 'cover' }} width="38" />
                      : <span aria-hidden="true" className="rounded-circle bg-secondary-subtle d-inline-flex justify-content-center align-items-center fw-semibold" style={{ width: 38, height: 38 }}>{displayName(result).slice(0, 1).toUpperCase()}</span>}
                    <span className="min-w-0">
                      <strong className="d-block text-truncate">{displayName(result)}</strong>
                      <span className="small text-secondary">{t(result.role)} · {result.department?.name || result.university?.name || result.username}</span>
                    </span>
                    {onlineUsers[id] && <span className="badge text-bg-success ms-auto">{t('Online')}</span>}
                  </button>
                )
              })}
              {searchText.trim() && !searching && searchResults.length === 0 && (
                <p className="small text-secondary p-3 mb-0">{t('No matching students or lecturers.')}</p>
              )}
              {loadingConversations
                ? <p className="small text-secondary p-3 mb-0">{t('Loading conversations…')}</p>
                : conversations.map((conversation) => {
                  const id = String(conversation.id || conversation._id)
                  const person = conversation.participant || conversation.otherUser
                  const personId = String(person?._id || person?.id || '')
                  return (
                    <div className={`list-group-item private-conversation-row ${activeId === id ? 'active' : ''}`} key={id}>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className={`btn p-0 border-0 text-start flex-grow-1 d-flex align-items-center gap-2 min-w-0 private-conversation-open ${activeId === id ? 'text-white' : 'text-body'}`}
                          onClick={() => {
                            setReplyTo(null)
                            setActiveId(id)
                          }}
                          type="button"
                        >
                          {person?.profilePhoto
                            ? <img alt="" className="rounded-circle flex-shrink-0" height="38" src={getAvatarUrl(person.profilePhoto)} style={{ objectFit: 'cover' }} width="38" />
                            : <span aria-hidden="true" className="rounded-circle bg-secondary-subtle d-inline-flex justify-content-center align-items-center fw-semibold flex-shrink-0" style={{ width: 38, height: 38 }}>{displayName(person).slice(0, 1).toUpperCase()}</span>}
                          <span className="min-w-0 flex-grow-1">
                            <span className="d-flex align-items-center justify-content-between gap-2">
                              <strong className="d-block text-truncate">{displayName(person)}</strong>
                              <small className={`flex-shrink-0 ${activeId === id ? 'text-white-50' : 'text-secondary'}`}>{conversationDate(conversation.updatedAt)}</small>
                            </span>
                            <span className={`small d-block text-truncate ${activeId === id ? 'text-white-50' : 'text-secondary'}`}>
                              {conversation.lastMessage || t('Start a conversation')}
                            </span>
                          </span>
                          {onlineUsers[personId] && <span aria-label={t('Online')} className="text-success">●</span>}
                          {conversation.unreadCount > 0 && <span className="badge rounded-pill text-bg-primary">{conversation.unreadCount}</span>}
                        </button>
                        <details className="private-conversation-menu">
                          <summary aria-label={t('Conversation actions')} title={t('Conversation actions')}>
                            {conversation.pinned && <span aria-label={t('Pinned')} title={t('Pinned')}>📌</span>}
                            <span aria-hidden="true">⋮</span>
                          </summary>
                          <div className="private-conversation-menu__items">
                          <button
                            className="btn btn-sm"
                            onClick={() => void togglePinned(conversation)}
                            type="button"
                          >
                            {t(conversation.pinned ? 'Unpin' : 'Pin')}
                          </button>
                          <button
                            className="btn btn-sm text-danger"
                            onClick={() => void removeConversation(conversation)}
                            type="button"
                          >
                            {t('Remove')}
                          </button>
                          </div>
                        </details>
                      </div>
                    </div>
                  )
                })}
            </div>
          </aside>
          <div className="col-12 col-lg-8 col-xl-9">
            {activeConversation?.blocked && <div className="alert alert-warning m-3 mb-0" role="status">
              {t(activeConversation.blockedByMe ? 'You blocked this user. Unblock them to send or react to messages.' : 'This user has blocked you. You cannot send or react to messages.')}
            </div>}
            {replyTo && <div className="alert alert-secondary d-flex justify-content-between align-items-center gap-2 m-3 mb-0 py-2">
              <span className="text-truncate">{t('Replying to')}: {replyTo.deletedAt ? t('Message deleted') : replyTo.body || t('Attachment')}</span>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setReplyTo(null)} type="button">{t('Cancel')}</button>
            </div>}
            {loadingMessages && activeId
              ? <div className="text-secondary text-center p-5" role="status">{t('Loading messages…')}</div>
              : <ChatWindow
                currentUserId={currentUserId}
                appearance="private"
                disabled={!activeId || activeConversation?.blocked}
                draft={draft}
                file={file}
                headerActions={activeConversation && (activeConversation.blockedByMe
                  ? <button className="btn btn-sm btn-outline-success" onClick={() => void toggleBlocked(false)} type="button">{t('Unblock')}</button>
                  : !activeConversation.blocked
                    ? <button className="btn btn-sm btn-outline-danger" onClick={() => void toggleBlocked(true)} type="button">{t('Block')}</button>
                    : null)}
                hasMore={hasMore}
                loadingMore={loadingOlder}
                messages={messages}
                onClearFile={() => setFile(null)}
                onDeleteForMe={deleteMessageForMe}
                onDeleteForEveryone={deleteMessageForEveryone}
                onDownload={downloadAttachment}
                onDraftChange={setDraft}
                onFileChange={setFile}
                onLoadOlder={loadOlder}
                onReact={reactToMessage}
                reactionsDisabled={activeConversation?.blocked}
                onReply={setReplyTo}
                onSubmit={send}
                onTyping={updateTyping}
                sending={sending}
                headerAvatar={participant?.profilePhoto ? getAvatarUrl(participant.profilePhoto) : ''}
                headerAvatarInitial={participant ? displayName(participant).slice(0, 1).toUpperCase() : ''}
                showReceipts
                status={participant ? { online } : null}
                title={participant ? displayName(participant) : t('Choose a conversation')}
                typingLabel={typingName ? `${typingName} ${t('is typing…')}` : ''}
              />}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PrivateMessagesPage
