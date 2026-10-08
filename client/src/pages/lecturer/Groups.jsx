import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import lecturerService from '../../services/lecturerService.js'
import { EmptyState, PageHeader, RequestState } from '../../components/portal/lecturer/LecturerUI.jsx'
import { errorMessage, itemId, listFrom, unwrap } from '../../components/portal/lecturer/lecturerUtils.js'

function LecturerGroups() {
  const [groups, setGroups] = useState([])
  const [form, setForm] = useState({ name: '', description: '' })
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
      await lecturerService.createGroup(form)
      setForm({ name: '', description: '' })
      setNotice('Group created.')
      await load()
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to create the group.')) }
    finally { setSaving(false) }
  }

  async function deleteGroup(group) {
    const id = itemId(group)
    if (id == null || !window.confirm(`Delete “${group.name || group.title || 'this group'}”?`)) return
    setError(''); setNotice('')
    try {
      await lecturerService.deleteGroup(id)
      setNotice('Group deleted.')
      await load()
    } catch (requestError) { setError(errorMessage(requestError, 'Unable to delete the group.')) }
  }

  return (
    <section>
      <PageHeader title="Teaching groups" description="Create and manage your lecturer groups." />
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      <form className="card mb-4" onSubmit={createGroup}>
        <div className="card-header bg-white"><h2 className="h5 mb-0">Create a group</h2></div>
        <div className="card-body"><div className="row g-3">
          <div className="col-md-4"><label className="form-label" htmlFor="group-name">Group name</label><input id="group-name" className="form-control" required maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div className="col-md-8"><label className="form-label" htmlFor="group-description">Description</label><input id="group-description" className="form-control" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
        </div></div>
        <div className="card-footer bg-white text-end"><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create group'}</button></div>
      </form>
      <RequestState error={error && loading ? error : ''} loading={loading} onRetry={refresh} />
      {!loading && !error && (groups.length ? <div className="row g-3">
        {groups.map((group, index) => <div className="col-md-6 col-xl-4" key={itemId(group) ?? index}>
          <article className="card h-100"><div className="card-body">
            <h2 className="h5">{itemId(group) != null ? <Link className="text-decoration-none" to={`/lecturer/groups/${itemId(group)}`}>{group.name || group.title || 'Untitled group'}</Link> : group.name || group.title || 'Untitled group'}</h2>
            <p className="text-secondary">{group.description || 'No description provided.'}</p>
            {group.memberCount != null && <span className="small text-secondary">{group.memberCount} members</span>}
          </div><div className="card-footer bg-white d-flex justify-content-between gap-2">
            {itemId(group) != null ? <Link className="btn btn-sm btn-outline-primary" to={`/lecturer/groups/${itemId(group)}`}>Open group</Link> : <span />}
            {itemId(group) != null && <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteGroup(group)}>Delete</button>}
          </div></article>
        </div>)}
      </div> : <div className="card"><EmptyState title="No groups found">Create a group to start organizing discussions and students.</EmptyState></div>)}
    </section>
  )
}

export default LecturerGroups
