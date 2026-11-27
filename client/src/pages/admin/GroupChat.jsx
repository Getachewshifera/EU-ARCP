import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GroupChat from '../../components/chat/GroupChat.jsx'
import chatService from '../../services/chatService.js'
import studentService from '../../services/studentService.js'
import useLanguage from '../../hooks/useLanguage.js'

function AdminGroupChat() {
  const { id } = useParams()
  const { t } = useLanguage()
  const [group, setGroup] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadGroup = useCallback(async () => {
    try {
      const response = await studentService.getGroup(id)
      setGroup(response.data?.item || response.data?.group || null)
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to load this group.'))
    }
  }, [id, t])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadGroup() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadGroup])

  async function addMember(event) {
    event.preventDefault()
    setSaving(true); setError(''); setNotice('')
    try {
      await chatService.inviteGroupMember(id, memberEmail)
      setMemberEmail('')
      setNotice(t('Member added to the group.'))
      await loadGroup()
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to add this member.'))
    } finally {
      setSaving(false)
    }
  }

  async function removeMember(memberId) {
    if (!window.confirm(t('Remove this member from the group?'))) return
    setSaving(true); setError(''); setNotice('')
    try {
      await chatService.removeGroupMember(id, memberId)
      setNotice(t('Member removed from the group.'))
      await loadGroup()
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to remove this member.'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleAdmin(memberId, isAdmin) {
    setSaving(true); setError(''); setNotice('')
    try {
      await chatService.updateGroupAdmin(id, memberId, isAdmin)
      setNotice(t(isAdmin ? 'Group admin permission granted.' : 'Group admin permission removed.'))
      await loadGroup()
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to update group admin permissions.'))
    } finally {
      setSaving(false)
    }
  }

  async function uploadImage(event) {
    event.preventDefault()
    if (!imageFile) return
    const data = new FormData()
    data.append('image', imageFile)
    setSaving(true); setError(''); setNotice('')
    try {
      await chatService.uploadGroupImage(id, data)
      setImageFile(null)
      setNotice(t('Group image updated.'))
      await loadGroup()
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || t('Unable to update the group image.'))
    } finally {
      setSaving(false)
    }
  }

  const members = group?.members || []
  const admins = group?.admins || []
  const ownerId = String(group?.owner?._id || group?.owner || '')

  return (
    <section>
      <header className="d-flex justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">{t('Group chat')}</h1>
          <p className="text-secondary mb-0">{t('Review group messages and moderate inappropriate content.')}</p>
        </div>
        <Link className="btn btn-outline-secondary" to="/admin/groups">{t('All groups')}</Link>
      </header>
      {error && <div className="alert alert-danger" role="alert">{t(error)}</div>}
      {notice && <div className="alert alert-success" role="status">{t(notice)}</div>}
      {group && String(group._id || group.id) === String(id) && (
        <section className="card mb-4" aria-labelledby="group-members-heading">
          <div className="card-body">
            <h2 className="h5" id="group-members-heading">{t('Group members')} · {group.name || group.title}</h2>
            <p className="text-secondary">{t('Manage membership, group admins, and the group profile image.')}</p>
            {group.imageUrl && <img alt="" className="rounded-circle mb-3" height="72" src={group.imageUrl} style={{ objectFit: 'cover' }} width="72" />}
            <ul className="list-group mb-3">
              {members.map((member, index) => {
                const memberId = String(member._id || member.id)
                const isOwner = memberId === ownerId
                const isAdmin = admins.some((admin) => String(admin._id || admin.id || admin) === memberId)
                return (
                  <li className="list-group-item d-flex justify-content-between align-items-center gap-2" key={memberId || index}>
                    <span>{member.name || member.email || t('Group member')} {(isOwner || isAdmin) && <span className="badge text-bg-secondary ms-2">{t(isOwner ? 'Owner' : 'Admin')}</span>}</span>
                    {!isOwner && <span className="d-flex flex-wrap gap-2">
                      <button className="btn btn-sm btn-outline-secondary" disabled={saving} onClick={() => void toggleAdmin(memberId, !isAdmin)} type="button">{t(isAdmin ? 'Remove admin' : 'Make admin')}</button>
                      <button className="btn btn-sm btn-outline-danger" disabled={saving} onClick={() => void removeMember(memberId)} type="button">{t('Remove')}</button>
                    </span>}
                  </li>
                )
              })}
            </ul>
            <form className="mb-3" onSubmit={addMember}>
              <label className="form-label" htmlFor="admin-group-member-email">{t('Add member by email')}</label>
              <div className="input-group">
                <input className="form-control" id="admin-group-member-email" onChange={(event) => setMemberEmail(event.target.value)} required type="email" value={memberEmail} />
                <button className="btn btn-outline-primary" disabled={saving} type="submit">{t('Add member')}</button>
              </div>
            </form>
            <form onSubmit={uploadImage}>
              <label className="form-label" htmlFor="admin-group-image">{t('Group profile image')}</label>
              <div className="input-group">
                <input accept="image/jpeg,image/png,image/webp" className="form-control" id="admin-group-image" onChange={(event) => setImageFile(event.target.files?.[0] || null)} type="file" />
                <button className="btn btn-outline-primary" disabled={saving || !imageFile} type="submit">{t('Upload image')}</button>
              </div>
            </form>
          </div>
        </section>
      )}
      {group && String(group._id || group.id) === String(id) && <GroupChat canModerate group={group} groupId={id} key={id} />}
    </section>
  )
}

export default AdminGroupChat
