import { useState } from 'react'
import Navbar from '../../components/layout/Navbar.jsx'
import contactService from '../../services/contactService.js'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await contactService.send(form)
      setSent(true)
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Your message could not be sent. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="container py-5">
        <div className="mx-auto" style={{ maxWidth: '42rem' }}>
          <h1 className="h2">Contact the administration team</h1>
          <p className="text-secondary">Send a message or question to EU-ARCP administrators.</p>
          {sent && <div className="alert alert-success" role="status">Your message was sent to the administration team.</div>}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          <form className="vstack gap-3" onSubmit={submit}>
            <div><label className="form-label" htmlFor="contact-name">Name</label><input id="contact-name" className="form-control" maxLength="120" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div><label className="form-label" htmlFor="contact-email">Email</label><input id="contact-email" className="form-control" type="email" maxLength="254" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            <div><label className="form-label" htmlFor="contact-subject">Subject</label><input id="contact-subject" className="form-control" maxLength="160" required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></div>
            <div><label className="form-label" htmlFor="contact-message">Message</label><textarea id="contact-message" className="form-control" rows="6" maxLength="4000" required value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></div>
            <button type="submit" className="btn btn-primary align-self-start" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
          </form>
        </div>
      </main>
    </>
  )
}