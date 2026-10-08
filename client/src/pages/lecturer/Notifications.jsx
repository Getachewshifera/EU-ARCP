import { useCallback, useEffect, useState } from 'react'
import lecturerService from '../../services/lecturerService.js'
import { EmptyState, PageHeader, RequestState } from '../../components/portal/lecturer/LecturerUI.jsx'
import { displayDate, errorMessage, itemId, listFrom, unwrap } from '../../components/portal/lecturer/lecturerUtils.js'

function LecturerNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try { setNotifications(listFrom(unwrap(await lecturerService.listNotifications({})), 'notifications')) }
    catch (requestError) { setError(errorMessage(requestError, 'Unable to load notifications.')) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const refresh = () => {
    setLoading(true)
    setError('')
    void load()
  }

  async function markRead(notification) {
    const id = itemId(notification)
    if (id == null) return
    setWorking(id); setError('')
    try {
      await lecturerService.markNotificationRead(id)
      setNotifications((current) => current.map((item) => itemId(item) === id ? { ...item, read: true, isRead: true } : item))
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to mark this notification as read.')) }
    finally { setWorking(null) }
  }

  return (
    <section>
      <PageHeader title="Notifications" description="Stay up to date with activity in your lecturer workspace."
        actions={<button className="btn btn-outline-secondary" type="button" onClick={refresh} disabled={loading}>Refresh</button>} />
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <RequestState error={error && loading ? error : ''} loading={loading} onRetry={refresh} />
      {!loading && !error && <div className="card">
        {notifications.length ? <ul className="list-group list-group-flush">
          {notifications.map((notification, index) => {
            const isRead = notification.read ?? notification.isRead ?? notification.is_read ?? Boolean(notification.readAt || notification.read_at)
            return <li className="list-group-item p-3" key={itemId(notification) ?? index}>
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2"><h2 className="h6 mb-1">{notification.title || notification.subject || 'Notification'}</h2>{!isRead && <span className="badge text-bg-primary">New</span>}</div>
                  <p className="mb-1 text-secondary">{notification.message || notification.body || 'No additional details.'}</p>
                  <small className="text-secondary">{displayDate(notification.createdAt || notification.created_at)}</small>
                </div>
                {!isRead && itemId(notification) != null && <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => markRead(notification)} disabled={working === itemId(notification)}>{working === itemId(notification) ? 'Updating…' : 'Mark as read'}</button>}
              </div>
            </li>
          })}
        </ul> : <EmptyState title="You’re all caught up">New notifications will appear here.</EmptyState>}
      </div>}
    </section>
  )
}

export default LecturerNotifications
