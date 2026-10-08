import React, { useCallback, useEffect, useState } from 'react'
import studentService from '../../services/studentService.js'
import { asEntity, asList, displayPerson, formatDate, getErrorMessage, getRecordId } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, LoadingState, ErrorState, EmptyState, Notice } from '../../components/portal/student/StudentUi.jsx'

function messageList(response) {
  const result = asEntity(response, ['conversation'])
  const items = asList(response, ['messages', 'items'])
  return items.length ? items : asList(result.messages, ['messages'])
}

export default function PrivateMessages() {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const loadConversations = useCallback(async () => {
    try {
      const items = asList(await studentService.listConversations({}), ['conversations'])
      setConversations(items)
      setActiveId((current) => current && items.some((item) => getRecordId(item) === current) ? current : getRecordId(items[0]))
      if (items.length === 0) setMessages([])
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(loadConversations, 0)
    return () => window.clearTimeout(timer)
  }, [loadConversations])
  const retryConversations = () => {
    setLoading(true)
    loadConversations()
  }

  const loadMessages = useCallback(async () => {
    if (!activeId) return
    try {
      setMessages(messageList(await studentService.listMessages(activeId)))
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setMessagesLoading(false)
    }
  }, [activeId])
  useEffect(() => {
    const timer = window.setTimeout(loadMessages, 0)
    return () => window.clearTimeout(timer)
  }, [loadMessages])
  const retryMessages = () => {
    setMessagesLoading(true)
    loadMessages()
  }

  async function send(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!activeId || !content) return
    setSending(true)
    setError('')
    setNotice('')
    try {
      await studentService.sendMessage(activeId, { content })
      setDraft('')
      setNotice('Message sent.')
      await loadMessages()
      await loadConversations()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="container py-4">
      <PageHeader title="Private messages" description="Read and send messages in your conversations." />
      {notice && <Notice>{notice}</Notice>}
      {error && <ErrorState message={error} onRetry={activeId ? retryMessages : retryConversations} />}
      {loading ? <LoadingState label="Loading conversations…" /> : conversations.length === 0
        ? <EmptyState title="No conversations yet" description="When you have a conversation, it will appear here." />
        : <div className="row g-3">
          <aside className="col-12 col-md-4 col-lg-3" aria-label="Conversations">
            <div className="list-group">
              {conversations.map((conversation, index) => {
                const id = getRecordId(conversation)
                const person = conversation.otherParticipant || conversation.recipient || conversation.participant || conversation.user
                return <button type="button" key={id || index} className={`list-group-item list-group-item-action ${id === activeId ? 'active' : ''}`}
                  onClick={() => { setMessagesLoading(true); setActiveId(id) }}>
                  <span className="d-block fw-semibold">{displayPerson(person) || conversation.title || 'Conversation'}</span>
                  {conversation.lastMessage && <span className="small d-block text-truncate">{conversation.lastMessage.content || conversation.lastMessage}</span>}
                </button>
              })}
            </div>
          </aside>
          <section className="col-12 col-md-8 col-lg-9">
            <div className="card">
              <div className="card-body" style={{ minHeight: '18rem', maxHeight: '55vh', overflowY: 'auto' }} aria-live="polite">
                {messagesLoading ? <LoadingState label="Loading messages…" /> : messages.length === 0
                  ? <EmptyState title="No messages in this conversation" description="Send a message to start the conversation." />
                  : <ol className="list-unstyled mb-0 d-flex flex-column gap-3">
                    {messages.map((message, index) => {
                      const sender = displayPerson(message.sender || message.from)
                      return <li key={message._id || message.id || index} className="border rounded-3 p-3">
                        {sender && <p className="small fw-semibold mb-1">{sender}</p>}
                        <p className="mb-1">{message.content || message.text || message.body || ''}</p>
                        {(message.createdAt || message.sentAt) && <time className="small text-body-secondary" dateTime={message.createdAt || message.sentAt}>{formatDate(message.createdAt || message.sentAt)}</time>}
                      </li>
                    })}
                  </ol>}
              </div>
              <div className="card-footer bg-body">
                <form onSubmit={send}>
                  <label className="form-label" htmlFor="message-draft">Write a message</label>
                  <div className="input-group">
                    <textarea id="message-draft" className="form-control" rows="2" maxLength="4000" required value={draft}
                      onChange={(event) => setDraft(event.target.value)} disabled={!activeId || sending} />
                    <button className="btn btn-primary" type="submit" disabled={!activeId || !draft.trim() || sending}>{sending ? 'Sending…' : 'Send'}</button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>}
    </main>
  )
}
