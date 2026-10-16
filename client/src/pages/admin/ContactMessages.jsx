import { useCallback, useEffect, useState } from 'react'
import adminService from '../../services/adminService.js'

function ContactMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const loadMessages = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await adminService.getContactMessages()
      setMessages(response.data?.items || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load contact messages.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadMessages() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadMessages])

  async function updateStatus(message, status) {
    const id = message._id || message.id
    setBusyId(id)
    setError('')
    try {
      await adminService.updateContactMessage(id, { status })
      await loadMessages()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this message.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
        <div><h1 className="h3 mb-1">Contact messages</h1><p className="text-secondary mb-0">Messages sent through the public contact form.</p></div>
        <button className="btn btn-outline-secondary" type="button" disabled={loading} onClick={loadMessages}>Refresh</button>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {loading ? <p role="status">Loading messages…</p> : messages.length === 0 ? <p className="text-secondary">No contact messages yet.</p> : (
        <div className="table-responsive"><table className="table align-middle">
          <thead><tr><th>Sender</th><th>Message</th><th>Received</th><th>Status</th></tr></thead>
          <tbody>{messages.map((message) => <tr key={message._id}>
            <td><strong>{message.name}</strong><br /><a href={`mailto:${message.email}`}>{message.email}</a></td>
            <td><strong>{message.subject}</strong><p className="mb-0 text-secondary text-break">{message.message}</p></td>
            <td>{message.createdAt ? new Date(message.createdAt).toLocaleString() : '—'}</td>
            <td><select className="form-select" aria-label={`Status for ${message.subject}`} disabled={busyId === message._id} value={message.status} onChange={(event) => updateStatus(message, event.target.value)}>
              <option value="open">Open</option><option value="read">Read</option><option value="closed">Closed</option>
            </select></td>
          </tr>)}</tbody>
        </table></div>
      )}
    </section>
  )
}

export default ContactMessages