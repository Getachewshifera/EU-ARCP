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
  const [editForm, setEditForm] = useState({ name: '', description: '', course: '', isPrivate: false })
  const [memberEmail, setMemberEmail] = useState('')

  const loadGroup = useCallback(async () => {
    try {
      const result = groupFrom(await studentService.getGroup(id))
      setGroup(result)
      setEditForm({ name: result.name || result.title || '', description: result.description || '', course: result.course || '', isPrivate: result.isPrivate === true })
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
  const canDelete = group?.permissions?.canDelete === true
  const canManageAdmins = group?.permissions?.canManageAdmins === true
  const canLeave = group?.permissions?.canLeave !== false

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

  async function deleteGroup() {
    if (!window.confirm('Delete this group and its messages? This cannot be undone.')) return
    setBusy(true)
    setError('')
    try {
      await studentService.deleteGroup(id)
      window.location.assign('/student/groups')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      setBusy(false)
    }
  }

  async function inviteMember(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await studentService.inviteGroupMember(id, memberEmail)
      setMemberEmail('')
      setNotice('Member added to the group.')
      await loadGroup()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  async function setMemberAdmin(memberId, isAdmin) {
    setBusy(true)
    setError('')
    try {
      await studentService.updateGroupAdmin(id, memberId, isAdmin)
      setNotice(isAdmin ? 'Group admin permission granted.' : 'Group admin permission removed.')
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
                      <dt className="col-sm-3">Visibility</dt><dd className="col-sm-9">{group?.isPrivate ? 'Private' : 'Public'}</dd>
                      {group?.course && <><dt className="col-sm-3">Course</dt><dd className="col-sm-9">{group.course}</dd></>}
                      {group?.owner && <><dt className="col-sm-3">Created by</dt><dd className="col-sm-9">{displayPerson(group.owner)}</dd></>}
                      {group?.createdBy && !group?.owner && <><dt className="col-sm-3">Created by</dt><dd className="col-sm-9">{displayPerson(group.createdBy)}</dd></>}
                      {group?.createdAt && <><dt className="col-sm-3">Created</dt><dd className="col-sm-9">{formatDate(group.createdAt)}</dd></>}
                      {group?.memberCount !== undefined && <><dt className="col-sm-3">Members</dt><dd className="col-sm-9">{group.memberCount}</dd></>}
                    </dl>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {(!isMember || canLeave) && <button type="button" className={`btn ${isMember ? 'btn-outline-danger' : 'btn-primary'}`} disabled={busy}
                      onClick={() => membershipAction(isMember ? studentService.leaveGroup : studentService.joinGroup)}>
                      {busy ? 'Please wait…' : isMember ? 'Leave group' : 'Join group'}
                    </button>}
                    {canEdit && <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(true)}>Edit details</button>}
                    {canDelete && <button type="button" className="btn btn-outline-danger" disabled={busy} onClick={deleteGroup}>Delete group</button>}
                  </div>
                </div>
              ) : <form onSubmit={saveGroup}>
                <div className="mb-3"><label className="form-label" htmlFor="group-name">Group name</label>
                  <input className="form-control" id="group-name" required value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></div>
                <div className="mb-3"><label className="form-label" htmlFor="group-description">Description</label>
                  <textarea className="form-control" id="group-description" rows="4" value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} /></div>
                <div className="mb-3"><label className="form-label" htmlFor="group-course">Course</label>
                  <input className="form-control" id="group-course" maxLength="160" value={editForm.course} onChange={(event) => setEditForm({ ...editForm, course: event.target.value })} /></div>
                <div className="form-check mb-3"><input className="form-check-input" id="group-private" type="checkbox" checked={editForm.isPrivate} onChange={(event) => setEditForm({ ...editForm, isPrivate: event.target.checked })} />
                  <label className="form-check-label" htmlFor="group-private">Private group</label></div>
                <div className="d-flex gap-2"><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save details'}</button>
                  <button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={() => setEditing(false)}>Cancel</button></div>
              </form>}
            </div>
          </section>
          <div className="row g-4">
            <section className="col-12 col-lg-6">
              <h2 className="h5 mb-3">Members</h2>
              {members.length ? <ul className="list-group">{members.map((member, index) => {
                const memberId = member._id || member.id
                const isAdmin = asList(group?.admins, ['admins']).some((admin) => String(admin._id || admin.id || admin) === String(memberId))
                const isGroupOwner = String(group?.owner?._id || group?.owner || '') === String(memberId)
                return <li key={memberId || index} className="list-group-item d-flex justify-content-between align-items-center gap-2">
                  <span>{displayPerson(member) || 'Group member'}{(isAdmin || isGroupOwner) && <span className="badge text-bg-secondary ms-2">{isGroupOwner ? 'Owner' : 'Admin'}</span>}</span>
                  {canManageAdmins && !isGroupOwner && memberId && <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={() => setMemberAdmin(memberId, !isAdmin)}>{isAdmin ? 'Remove admin' : 'Make admin'}</button>}
                </li>
              })}</ul>
                : <EmptyState title="Member list unavailable" description="Member information has not been provided for this group." />}
              {canEdit && <form className="mt-3" onSubmit={inviteMember}>
                <label className="form-label" htmlFor="invite-member-email">Add member by email</label>
                <div className="input-group"><input className="form-control" id="invite-member-email" type="email" required value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} />
                  <button className="btn btn-outline-primary" type="submit" disabled={busy}>Add member</button></div>
              </form>}
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
