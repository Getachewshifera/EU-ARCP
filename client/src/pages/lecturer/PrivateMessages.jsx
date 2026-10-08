import { useCallback, useEffect, useState } from 'react'
import lecturerService from '../../services/lecturerService.js'
import { EmptyState, PageHeader, RequestState } from '../../components/portal/lecturer/LecturerUI.jsx'
import { displayDate, errorMessage, itemId, listFrom, unwrap } from '../../components/portal/lecturer/lecturerUtils.js'

function LecturerPrivateMessages() {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState('')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const loadConversations = useCallback(async () => {
    try {
      const result = listFrom(unwrap(await lecturerService.listConversations({})), 'conversations')
      setConversations(result)
      setActiveId((current) => current || String(itemId(result[0]) ?? ''))
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to load conversations.')) }
    finally { setLoadingConversations(false) }
  }, [])
  useEffect(() => { void Promise.resolve().then(loadConversations) }, [loadConversations])
  const refreshConversations = () => {
    setLoadingConversations(true)
    setError('')
    void loadConversations()
  }

  const loadMessages = useCallback(async () => {
    if (!activeId) return
    try {
      const result = unwrap(await lecturerService.listMessages(activeId))
      setMessages(listFrom(result?.conversation ?? result, 'messages'))
    }
    catch (requestError) { setError(errorMessage(requestError, 'Unable to load messages.')) }
    finally { setLoadingMessages(false) }
  }, [activeId])
  useEffect(() => { void Promise.resolve().then(loadMessages) }, [loadMessages])

  async function send(event) {
    event.preventDefault()
    if (!draft.trim() || !activeId) return
    setSending(true); setError('')
    try {
      await lecturerService.sendMessage(activeId, { message: draft.trim() })
      setDraft('')
      await loadMessages()
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to send this message.')) }
    finally { setSending(false) }
  }

  const active = conversations.find((conversation) => String(itemId(conversation)) === activeId)

  return (
    <section>
      <PageHeader title="Private messages" description="Read and reply to your conversations."
        actions={<button className="btn btn-outline-secondary" type="button" onClick={refreshConversations} disabled={loadingConversations}>Refresh</button>} />
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <RequestState error={error && loadingConversations ? error : ''} loading={loadingConversations} onRetry={refreshConversations} />
      {!loadingConversations && <div className="card overflow-hidden">
        <div className="row g-0" style={{ minHeight: '28rem' }}>
          <aside className="col-md-4 col-lg-3 border-end">
            <h2 className="h6 p-3 mb-0 border-bottom">Conversations</h2>
            {conversations.length ? <div className="list-group list-group-flush">
              {conversations.map((conversation, index) => {
                const id = itemId(conversation)
                const recipient = conversation.participant?.name || conversation.otherUser?.name || conversation.user?.name || conversation.title || conversation.name || 'Conversation'
                return <button className={`list-group-item list-group-item-action text-start ${String(id) === activeId ? 'active' : ''}`} type="button" key={id ?? index} disabled={id == null} onClick={() => {
                  if (String(id) === activeId) return
                  setMessages([])
                  setLoadingMessages(true)
                  setError('')
                  setActiveId(String(id))
                }}>
                  <span className="d-block fw-medium">{recipient}</span><small className={String(id) === activeId ? 'text-white-50' : 'text-secondary'}>{conversation.lastMessage?.content || conversation.lastMessage || conversation.subject || 'Open conversation'}</small>
                </button>
              })}
            </div> : <div className="p-3"><EmptyState title="No conversations">Your private conversations will appear here.</EmptyState></div>}
          </aside>
          <div className="col-md-8 col-lg-9 d-flex flex-column">
            {active ? <>
              <div className="p-3 border-bottom"><h2 className="h6 mb-0">{active.participant?.name || active.otherUser?.name || active.user?.name || active.title || active.name || 'Conversation'}</h2></div>
              {loadingMessages ? <div className="p-3 text-secondary" role="status">Loading messages…</div> : messages.length ? <div className="p-3 flex-grow-1 overflow-auto" style={{ maxHeight: '26rem' }}>
                {messages.map((message, index) => <article className="mb-3" key={itemId(message) ?? index}>
                  <div className="d-flex justify-content-between gap-2"><strong className="small">{message.sender?.name || message.senderName || message.author?.name || 'Participant'}</strong><small className="text-secondary">{displayDate(message.createdAt || message.sentAt)}</small></div>
                  <p className="mb-0 text-break">{message.content || message.message || message.body || ''}</p>
                </article>)}
              </div> : <div className="p-3 flex-grow-1 text-secondary">No messages in this conversation yet.</div>}
              <form className="border-top p-3" onSubmit={send}>
                <label className="visually-hidden" htmlFor="message-draft">Write a message</label>
                <div className="input-group"><textarea id="message-draft" className="form-control" rows="2" placeholder="Write a reply…" value={draft} onChange={(event) => setDraft(event.target.value)} />
                  <button className="btn btn-primary" type="submit" disabled={sending || !draft.trim() || loadingMessages}>{sending ? 'Sending…' : 'Send'}</button></div>
              </form>
            </> : <div className="d-flex flex-grow-1 align-items-center justify-content-center p-4 text-center text-secondary">{conversations.length ? 'Choose a conversation to view messages.' : 'No conversation selected.'}</div>}
          </div>
        </div>
      </div>}
    </section>
  )
}

export default LecturerPrivateMessages
