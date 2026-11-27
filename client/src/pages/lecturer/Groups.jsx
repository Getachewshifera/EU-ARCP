import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import lecturerService from '../../services/lecturerService.js'
import chatService from '../../services/chatService.js'
import { EmptyState, PageHeader, RequestState } from '../../components/portal/lecturer/LecturerUI.jsx'
import { errorMessage, itemId, listFrom, unwrap } from '../../components/portal/lecturer/lecturerUtils.js'
import useLanguage from '../../hooks/useLanguage.js'

function LecturerGroups() {
  const { t } = useLanguage()
  const [groups, setGroups] = useState([])
  const [form, setForm] = useState({ name: '', description: '', groupType: 'custom' })
  const [groupImage, setGroupImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try { setGroups(listFrom(unwrap(await lecturerService.listGroups({})), 'groups')) }
    catch (requestError) { setError(errorMessage(requestError, 'Unable to load groups.')) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  const refresh = () => {
    setLoading(true)
    setError('')
    void load()
  }

  async function createGroup(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      const response = await lecturerService.createGroup(form)
      const group = response.data?.item
      const id = group?._id || group?.id
      const selectedImage = groupImage
      setForm({ name: '', description: '', groupType: 'custom' })
      setGroupImage(null)
      if (selectedImage && id) {
        const data = new FormData()
        data.append('image', selectedImage)
        try {
          await chatService.uploadGroupImage(id, data)
        } catch (imageError) {
          setNotice(t('Group created, but its image could not be uploaded.'))
          setError(errorMessage(imageError, t('Unable to upload the group image.')))
          await load()
          return
        }
      }
      setNotice(t('Group created.'))
      await load()
    } catch (requestError) { setError(errorMessage(requestError, t('Unable to create the group.'))) }
    finally { setSaving(false) }
  }

  async function deleteGroup(group) {
    const id = itemId(group)
    if (id == null || !window.confirm(`${t('Delete')} “${group.name || group.title || t('this group')}”?`)) return
    setError(''); setNotice('')
    try {
      await lecturerService.deleteGroup(id)
      setNotice(t('Group deleted.'))
      await load()
    } catch (requestError) { setError(errorMessage(requestError, t('Unable to delete the group.'))) }
  }

  return (
    <section>
      <PageHeader title="Teaching groups" description="Create and manage your lecturer groups." />
      {error && <div className="alert alert-danger" role="alert">{t(error)}</div>}
      {notice && <div className="alert alert-success" role="status">{t(notice)}</div>}
      <form className="card mb-4" onSubmit={createGroup}>
        <div className="card-header bg-white"><h2 className="h5 mb-0">{t('Create a group')}</h2></div>
        <div className="card-body"><div className="row g-3">
          <div className="col-md-4"><label className="form-label" htmlFor="group-name">{t('Group name')}</label><input id="group-name" className="form-control" required maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div className="col-md-8"><label className="form-label" htmlFor="group-description">{t('Description')}</label><input id="group-description" className="form-control" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
          <div className="col-md-4"><label className="form-label" htmlFor="group-type">{t('Group type')}</label><select id="group-type" className="form-select" value={form.groupType} onChange={(event) => setForm({ ...form, groupType: event.target.value })}>{['university', 'department', 'course', 'class', 'custom'].map((type) => <option key={type} value={type}>{t(type[0].toUpperCase() + type.slice(1))}</option>)}</select></div>
          <div className="col-md-8"><label className="form-label" htmlFor="group-image">{t('Group profile image')}</label><input id="group-image" className="form-control" accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => setGroupImage(event.target.files?.[0] || null)} /></div>
        </div></div>
        <div className="card-footer bg-white text-end"><button className="btn btn-primary" type="submit" disabled={saving}>{t(saving ? 'Creating…' : 'Create group')}</button></div>
      </form>
      <RequestState error={error && loading ? error : ''} loading={loading} onRetry={refresh} />
      {!loading && !error && (groups.length ? <div className="row g-3">
        {groups.map((group, index) => <div className="col-md-6 col-xl-4" key={itemId(group) ?? index}>
          <article className="card h-100"><div className="card-body">
            <h2 className="h5">{itemId(group) != null ? <Link className="text-decoration-none" to={`/lecturer/groups/${itemId(group)}`}>{group.name || group.title || t('Untitled group')}</Link> : group.name || group.title || t('Untitled group')}</h2>
            <p className="text-secondary">{group.description || t('No description provided.')}</p>
            {group.memberCount != null && <span className="small text-secondary">{group.memberCount} {t('members')}</span>}
          </div><div className="card-footer bg-white d-flex justify-content-between gap-2">
            {itemId(group) != null ? <Link className="btn btn-sm btn-outline-primary" to={`/lecturer/groups/${itemId(group)}`}>{t('Open group')}</Link> : <span />}
            {itemId(group) != null && <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteGroup(group)}>{t('Delete')}</button>}
          </div></article>
        </div>)}
      </div> : <div className="card"><EmptyState title={t('No groups found')}>{t('Create a group to start organizing discussions and students.')}</EmptyState></div>)}
    </section>
  )
}

export default LecturerGroups
