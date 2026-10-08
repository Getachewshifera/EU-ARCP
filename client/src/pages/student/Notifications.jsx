import React, { useCallback, useEffect, useState } from 'react'
import studentService from '../../services/studentService.js'
import { asList, formatDate, getErrorMessage, getRecordId } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, LoadingState, ErrorState, EmptyState, Notice } from '../../components/portal/student/StudentUi.jsx'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [updating, setUpdating] = useState('')

  const loadNotifications = useCallback(async () => {
    try {
      setNotifications(asList(await studentService.listNotifications({}), ['notifications']))
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(loadNotifications, 0)
    return () => window.clearTimeout(timer)
  }, [loadNotifications])
  const retryNotifications = () => {
    setLoading(true)
    loadNotifications()
  }

  async function markRead(notification) {
    const id = getRecordId(notification)
    if (!id) return
    setUpdating(id)
    setError('')
    setNotice('')
    try {
      await studentService.markNotificationRead(id)
      setNotifications((current) => current.map((item) => getRecordId(item) === id ? { ...item, read: true, isRead: true } : item))
      setNotice('Notification marked as read.')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setUpdating('')
    }
  }

  return (
    <main className="container py-4">
      <PageHeader title="Notifications" description="Important updates and activity related to your account." />
      {notice && <Notice>{notice}</Notice>}
      {loading ? <LoadingState label="Loading notifications…" /> : error ? <ErrorState message={error} onRetry={retryNotifications} /> : notifications.length === 0
        ? <EmptyState title="You are all caught up" description="New notifications will appear here." />
        : <div className="list-group">
          {notifications.map((notification, index) => {
            const id = getRecordId(notification)
            const isRead = notification.read === true || notification.isRead === true || notification.status === 'read'
            return <article key={id || index} className={`list-group-item ${!isRead ? 'list-group-item-primary' : ''}`}>
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-3">
                <div className="flex-grow-1">
                  <div className="d-flex gap-2 align-items-center">
                    <h2 className="h6 mb-1">{notification.title || notification.subject || 'Notification'}</h2>
                    {!isRead && <span className="badge text-bg-primary">New</span>}
                  </div>
                  <p className="mb-1">{notification.message || notification.body || notification.description || ''}</p>
                  {notification.createdAt && <time className="small text-body-secondary" dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>}
                </div>
                {!isRead && id && <button className="btn btn-sm btn-outline-primary align-self-start" type="button" disabled={updating === id} onClick={() => markRead(notification)}>
                  {updating === id ? 'Updating…' : 'Mark as read'}
                </button>}
              </div>
            </article>
          })}
        </div>}
    </main>
  )
}
