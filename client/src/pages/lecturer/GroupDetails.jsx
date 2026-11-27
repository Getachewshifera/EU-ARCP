import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import lecturerService from '../../services/lecturerService.js'
import chatService from '../../services/chatService.js'
import { PageHeader, RequestState } from '../../components/portal/lecturer/LecturerUI.jsx'
import { errorMessage, unwrap } from '../../components/portal/lecturer/lecturerUtils.js'
import GroupChat from '../../components/chat/GroupChat.jsx'
import useLanguage from '../../hooks/useLanguage.js'

function GroupDetails() {
  const { t } = useLanguage()
  const { id } = useParams()
  const [group, setGroup] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', groupType: 'custom', course: '', isPrivate: false })
  const [memberEmail, setMemberEmail] = useState('')
  const [groupImage, setGroupImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      const result = unwrap(await lecturerService.getGroup(id))
      const value = result?.group ?? result
      setGroup(value)
      setForm({
        name: value?.name ?? value?.title ?? '',
        description: value?.description ?? '',
        groupType: value?.groupType ?? 'custom',
        course: value?.course ?? '',
        isPrivate: value?.isPrivate === true,
      })
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to load this group.')) }
    finally { setLoading(false) }
  }, [id])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const refresh = () => {
    setLoading(true)
    setError('')
    void load()
  }

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      const result = unwrap(await lecturerService.updateGroup(id, form))
      const value = result?.group ?? result
      if (value && typeof value === 'object') {
        setGroup(value)
        setForm({
          name: value.name ?? value.title ?? form.name,
          description: value.description ?? form.description,
          groupType: value.groupType ?? form.groupType,
          course: value.course ?? form.course,
          isPrivate: value.isPrivate ?? form.isPrivate,
        })
      }
      setNotice(t('Group details updated.'))
    } catch (requestError) { setError(errorMessage(requestError, t('Unable to update the group.'))) }
    finally { setSaving(false) }
  }

  async function inviteMember(event) {
    event.preventDefault()
    setSaving(true); setError(''); setNotice('')
    try {
      await chatService.inviteGroupMember(id, memberEmail)
      setMemberEmail('')
      setNotice(t('Member added to the group.'))
      await load()
    } catch (requestError) { setError(errorMessage(requestError, t('Unable to add this member.'))) }
    finally { setSaving(false) }
  }

  async function updateAdmin(memberId, isAdmin) {
    setSaving(true); setError(''); setNotice('')
    try {
      await chatService.updateGroupAdmin(id, memberId, isAdmin)
      setNotice(t(isAdmin ? 'Group admin permission granted.' : 'Group admin permission removed.'))
      await load()
    } catch (requestError) { setError(errorMessage(requestError, t('Unable to update group admin permissions.'))) }
    finally { setSaving(false) }
  }

  async function removeMember(memberId) {
    if (!window.confirm(t('Remove this member from the group?'))) return
    setSaving(true); setError(''); setNotice('')
    try {
      await chatService.removeGroupMember(id, memberId)
      setNotice(t('Member removed from the group.'))
      await load()
    } catch (requestError) { setError(errorMessage(requestError, t('Unable to remove this member.'))) }
    finally { setSaving(false) }
  }

  async function uploadImage(event) {
    event.preventDefault()
    if (!groupImage) return
    const data = new FormData()
    data.append('image', groupImage)
    setSaving(true); setError(''); setNotice('')
    try {
      await chatService.uploadGroupImage(id, data)
      setGroupImage(null)
      setNotice(t('Group image updated.'))
      await load()
    } catch (requestError) { setError(errorMessage(requestError, t('Unable to update the group image.'))) }
    finally { setSaving(false) }
  }

  const canEdit = group?.permissions?.canEdit === true
  const canManageAdmins = group?.permissions?.canManageAdmins === true
  const isMember = group?.isMember === true

  return (
    <section>
      <PageHeader title={group?.name || group?.title || t('Group details')} description="View and update this teaching group."
        actions={<Link className="btn btn-outline-secondary" to="/lecturer/groups">{t('Back to groups')}</Link>} />
      <RequestState error={error && loading ? error : ''} loading={loading} onRetry={refresh} />
      {!loading && <>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {notice && <div className="alert alert-success" role="status">{notice}</div>}
        {group ? <>
          <section className="card mb-4">
            <div className="card-body">
              {group.imageUrl && <img alt="" className="rounded-circle mb-3" height="88" src={group.imageUrl} style={{ objectFit: 'cover' }} width="88" />}
              <dl className="row mb-4">
                <dt className="col-sm-3">{t('Members')}</dt><dd className="col-sm-9">{group.memberCount ?? group.members?.length ?? '—'}</dd>
                <dt className="col-sm-3">{t('Group type')}</dt><dd className="col-sm-9">{t(group.groupType || 'custom')}</dd>
                <dt className="col-sm-3">{t('Created')}</dt><dd className="col-sm-9">{group.createdAt ? new Date(group.createdAt).toLocaleDateString() : '—'}</dd>
              </dl>
              {canEdit && <form onSubmit={submit}>
                <div className="mb-3"><label className="form-label" htmlFor="group-name">{t('Group name')}</label><input id="group-name" className="form-control" required maxLength="160" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
                <div className="mb-3"><label className="form-label" htmlFor="group-description">{t('Description')}</label><textarea id="group-description" className="form-control" maxLength="2000" rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
                <div className="row g-3 mb-3">
                  <div className="col-md-6"><label className="form-label" htmlFor="group-course">{t('Course')}</label><input id="group-course" className="form-control" maxLength="160" value={form.course} onChange={(event) => setForm({ ...form, course: event.target.value })} /></div>
                  <div className="col-md-6"><label className="form-label" htmlFor="group-type">{t('Group type')}</label><select id="group-type" className="form-select" value={form.groupType} onChange={(event) => setForm({ ...form, groupType: event.target.value })}>{['university', 'department', 'course', 'class', 'custom'].map((type) => <option key={type} value={type}>{t(type[0].toUpperCase() + type.slice(1))}</option>)}</select></div>
                </div>
                <div className="form-check mb-3"><input id="group-private" className="form-check-input" type="checkbox" checked={form.isPrivate} onChange={(event) => setForm({ ...form, isPrivate: event.target.checked })} /><label className="form-check-label" htmlFor="group-private">{t('Private group')}</label></div>
                <button className="btn btn-primary" type="submit" disabled={saving}>{t(saving ? 'Saving…' : 'Save group')}</button>
              </form>}
              {canEdit && <form className="mt-4" onSubmit={uploadImage}>
                <label className="form-label" htmlFor="group-image">{t('Group profile image')}</label>
                <div className="input-group"><input id="group-image" className="form-control" accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => setGroupImage(event.target.files?.[0] || null)} />
                  <button className="btn btn-outline-primary" type="submit" disabled={saving || !groupImage}>{t('Upload image')}</button></div>
              </form>}
            </div>
          </section>
          <section className="mb-4">
            <h2 className="h5">{t('Members')}</h2>
            <ul className="list-group">
              {(group.members || []).map((member, index) => {
                const memberId = String(member._id || member.id)
                const ownerId = String(group.owner?._id || group.owner || '')
                const isOwner = memberId === ownerId
                const isAdmin = (group.admins || []).some((admin) => String(admin._id || admin.id || admin) === memberId)
                return <li className="list-group-item d-flex justify-content-between align-items-center gap-2" key={memberId || index}>
                  <span>{member.name || member.email || t('Group member')} {(isOwner || isAdmin) && <span className="badge text-bg-secondary ms-2">{t(isOwner ? 'Owner' : 'Admin')}</span>}</span>
                  <span className="d-flex gap-2">
                    {canManageAdmins && !isOwner && <button className="btn btn-sm btn-outline-secondary" disabled={saving} onClick={() => void updateAdmin(memberId, !isAdmin)} type="button">{t(isAdmin ? 'Remove admin' : 'Make admin')}</button>}
                    {canEdit && !isOwner && <button className="btn btn-sm btn-outline-danger" disabled={saving} onClick={() => void removeMember(memberId)} type="button">{t('Remove')}</button>}
                  </span>
                </li>
              })}
            </ul>
            {canEdit && <form className="mt-3" onSubmit={inviteMember}>
              <label className="form-label" htmlFor="invite-member-email">{t('Add member by email')}</label>
              <div className="input-group"><input id="invite-member-email" className="form-control" type="email" required value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} />
                <button className="btn btn-outline-primary" disabled={saving} type="submit">{t('Add member')}</button></div>
            </form>}
          </section>
          {isMember && <GroupChat canModerate={canEdit} group={group} groupId={id} key={id} />}
        </> : <div className="alert alert-warning">{t('The requested group was not found.')}</div>}
      </>}
    </section>
  )
}

export default GroupDetails
