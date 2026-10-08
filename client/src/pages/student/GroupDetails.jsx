import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import studentService from '../../services/studentService.js'
import { asEntity, asList, displayPerson, formatDate, getErrorMessage, getRecordTitle } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, LoadingState, ErrorState, EmptyState, Notice } from '../../components/portal/student/StudentUi.jsx'

function groupFrom(response) {
  return asEntity(response, ['group', 'item'])
}

export default function GroupDetails() {
  const { id } = useParams()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '' })

  const loadGroup = useCallback(async () => {
    try {
      const result = groupFrom(await studentService.getGroup(id))
      setGroup(result)
      setEditForm({ name: result.name || result.title || '', description: result.description || '' })
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => {
    const timer = window.setTimeout(loadGroup, 0)
    return () => window.clearTimeout(timer)
  }, [loadGroup])
  const retryGroup = () => {
    setLoading(true)
    loadGroup()
  }

  const isMember = group?.isMember === true || group?.joined === true || group?.membershipStatus === 'member'
  const canEdit = group?.permissions?.canEdit === true || group?.canEdit === true

  async function membershipAction(action) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action(id)
      setNotice(isMember ? 'You left the group.' : 'You joined the group.')
      await loadGroup()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  async function saveGroup(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await studentService.updateGroup(id, editForm)
      setNotice('Group details have been updated.')
      setEditing(false)
      await loadGroup()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  const members = asList(group?.members, ['members'])
  const resources = asList(group?.materials, ['materials'])

  return (
    <main className="container py-4">
      <PageHeader title="Group details" description="Group information and membership."
        actions={<Link className="btn btn-outline-secondary" to="/student/groups">All groups</Link>} />
      {loading ? <LoadingState label="Loading group…" /> : error && !group ? <ErrorState message={error} onRetry={retryGroup} /> : (
        <>
          <Notice variant="danger">{error}</Notice>
          <Notice>{notice}</Notice>
          <section className="card shadow-sm mb-4">
            <div className="card-body p-4">
              {!editing ? (
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-3">
                  <div><h2 className="h3">{getRecordTitle(group)}</h2>
                    {group?.description && <p>{group.description}</p>}
                    <dl className="row mb-0">
                      {group?.course && <><dt className="col-sm-3">Course</dt><dd className="col-sm-9">{group.course}</dd></>}
                      {group?.createdBy && <><dt className="col-sm-3">Created by</dt><dd className="col-sm-9">{displayPerson(group.createdBy)}</dd></>}
                      {group?.createdAt && <><dt className="col-sm-3">Created</dt><dd className="col-sm-9">{formatDate(group.createdAt)}</dd></>}
                      {group?.memberCount !== undefined && <><dt className="col-sm-3">Members</dt><dd className="col-sm-9">{group.memberCount}</dd></>}
                    </dl>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button type="button" className={`btn ${isMember ? 'btn-outline-danger' : 'btn-primary'}`} disabled={busy}
                      onClick={() => membershipAction(isMember ? studentService.leaveGroup : studentService.joinGroup)}>
                      {busy ? 'Please wait…' : isMember ? 'Leave group' : 'Join group'}
                    </button>
                    {canEdit && <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(true)}>Edit details</button>}
                  </div>
                </div>
              ) : <form onSubmit={saveGroup}>
                <div className="mb-3"><label className="form-label" htmlFor="group-name">Group name</label>
                  <input className="form-control" id="group-name" required value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></div>
                <div className="mb-3"><label className="form-label" htmlFor="group-description">Description</label>
                  <textarea className="form-control" id="group-description" rows="4" value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} /></div>
                <div className="d-flex gap-2"><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save details'}</button>
                  <button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={() => setEditing(false)}>Cancel</button></div>
              </form>}
            </div>
          </section>
          <div className="row g-4">
            <section className="col-12 col-lg-6">
              <h2 className="h5 mb-3">Members</h2>
              {members.length ? <ul className="list-group">{members.map((member, index) => <li key={member._id || member.id || index} className="list-group-item">{displayPerson(member) || 'Group member'}</li>)}</ul>
                : <EmptyState title="Member list unavailable" description="Member information has not been provided for this group." />}
            </section>
            <section className="col-12 col-lg-6">
              <h2 className="h5 mb-3">Shared materials</h2>
              {resources.length ? <div className="list-group">{resources.map((item, index) => {
                const materialId = item._id || item.id
                const title = item.title || item.name || 'Untitled'
                return materialId
                  ? <Link key={materialId} className="list-group-item list-group-item-action" to={`/student/materials/${encodeURIComponent(materialId)}`}>{title}</Link>
                  : <div key={`${title}-${index}`} className="list-group-item">{title}</div>
              })}</div>
                : <EmptyState title="No group materials" description="Materials shared with this group will appear here." />}
            </section>
          </div>
        </>
      )}
    </main>
  )
}
