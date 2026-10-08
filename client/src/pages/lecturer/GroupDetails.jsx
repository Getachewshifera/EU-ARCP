import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import lecturerService from '../../services/lecturerService.js'
import { PageHeader, RequestState } from '../../components/portal/lecturer/LecturerUI.jsx'
import { errorMessage, unwrap } from '../../components/portal/lecturer/lecturerUtils.js'

function GroupDetails() {
  const { id } = useParams()
  const [group, setGroup] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      const result = unwrap(await lecturerService.getGroup(id))
      const value = result?.group ?? result
      setGroup(value)
      setForm({ name: value?.name ?? value?.title ?? '', description: value?.description ?? '' })
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
        setForm({ name: value.name ?? value.title ?? form.name, description: value.description ?? form.description })
      }
      setNotice('Group details updated.')
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to update the group.')) }
    finally { setSaving(false) }
  }

  return (
    <section>
      <PageHeader title={group?.name || group?.title || 'Group details'} description="View and update this teaching group."
        actions={<Link className="btn btn-outline-secondary" to="/lecturer/groups">Back to groups</Link>} />
      <RequestState error={error && loading ? error : ''} loading={loading} onRetry={refresh} />
      {!loading && <>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {notice && <div className="alert alert-success" role="status">{notice}</div>}
        {group ? <form className="card" onSubmit={submit}>
          <div className="card-body">
            <dl className="row mb-4">
              <dt className="col-sm-3">Members</dt><dd className="col-sm-9">{group.memberCount ?? group.members?.length ?? '—'}</dd>
              <dt className="col-sm-3">Created</dt><dd className="col-sm-9">{group.createdAt ? new Date(group.createdAt).toLocaleDateString() : '—'}</dd>
            </dl>
            <div className="mb-3"><label className="form-label" htmlFor="group-name">Group name</label><input id="group-name" className="form-control" required maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
            <div><label className="form-label" htmlFor="group-description">Description</label><textarea id="group-description" className="form-control" rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
          </div>
          <div className="card-footer bg-white text-end"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save group'}</button></div>
        </form> : <div className="alert alert-warning">The requested group was not found.</div>}
      </>}
    </section>
  )
}

export default GroupDetails
