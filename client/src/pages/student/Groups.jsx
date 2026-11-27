import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import studentService from '../../services/studentService.js'
import chatService from '../../services/chatService.js'
import { asList, getErrorMessage, getRecordId, getRecordTitle } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../../components/portal/student/StudentUi.jsx'
import useLanguage from '../../hooks/useLanguage.js'

export default function Groups() {
  const { t } = useLanguage()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [createForm, setCreateForm] = useState({ name: '', description: '', course: '', groupType: 'custom', isPrivate: false })
  const [groupImage, setGroupImage] = useState(null)

  const loadGroups = useCallback(async () => {
    try {
      setGroups(asList(await studentService.listGroups(query ? { search: query } : {}), ['groups']))
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [query])
  useEffect(() => {
    const timer = window.setTimeout(loadGroups, 0)
    return () => window.clearTimeout(timer)
  }, [loadGroups])
  const retryGroups = () => {
    setLoading(true)
    loadGroups()
  }
  const submitSearch = (event) => {
    event.preventDefault()
    const nextQuery = search.trim()
    setLoading(true)
    if (nextQuery === query) loadGroups()
    else setQuery(nextQuery)
  }

  async function createGroup(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await studentService.createGroup(createForm)
      const group = response.data?.item
      const id = group?._id || group?.id
      const selectedImage = groupImage
      setCreateForm({ name: '', description: '', course: '', groupType: 'custom', isPrivate: false })
      setGroupImage(null)
      setCreating(false)
      if (selectedImage && id) {
        const data = new FormData()
        data.append('image', selectedImage)
        try {
          await chatService.uploadGroupImage(id, data)
        } catch (imageError) {
          setNotice(t('Your group was created, but its image could not be uploaded.'))
          setLoading(true)
          await loadGroups()
          setError(getErrorMessage(imageError))
          return
        }
      }
      setNotice(t('Your group has been created.'))
      setLoading(true)
      await loadGroups()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="container py-4">
      <PageHeader title="Study groups" description="Discover groups for your courses and interests."
        actions={<button type="button" className="btn btn-primary" onClick={() => setCreating(!creating)}>{t(creating ? 'Cancel' : 'Create group')}</button>} />
      {notice && <div className="alert alert-success" role="status">{t(notice)}</div>}
      {creating && <form className="card mb-4" onSubmit={createGroup}>
        <div className="card-body">
          <h2 className="h5">{t('New group')}</h2>
          <div className="mb-3"><label className="form-label" htmlFor="new-group-name">{t('Group name')}</label>
            <input className="form-control" id="new-group-name" maxLength="160" required value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} /></div>
          <div className="mb-3"><label className="form-label" htmlFor="new-group-course">{t('Course')}</label>
            <input className="form-control" id="new-group-course" maxLength="160" value={createForm.course} onChange={(event) => setCreateForm({ ...createForm, course: event.target.value })} /></div>
          <div className="mb-3"><label className="form-label" htmlFor="new-group-type">{t('Group type')}</label>
            <select className="form-select" id="new-group-type" value={createForm.groupType} onChange={(event) => setCreateForm({ ...createForm, groupType: event.target.value })}>
              {['university', 'department', 'course', 'class', 'custom'].map((type) => <option key={type} value={type}>{t(type[0].toUpperCase() + type.slice(1))}</option>)}
            </select></div>
          <div className="mb-3"><label className="form-label" htmlFor="new-group-image">{t('Group profile image')}</label>
            <input accept="image/jpeg,image/png,image/webp" className="form-control" id="new-group-image" onChange={(event) => setGroupImage(event.target.files?.[0] || null)} type="file" /></div>
          <div className="mb-3"><label className="form-label" htmlFor="new-group-description">{t('Description')}</label>
            <textarea className="form-control" id="new-group-description" maxLength="2000" rows="3" value={createForm.description} onChange={(event) => setCreateForm({ ...createForm, description: event.target.value })} /></div>
          <div className="form-check mb-3"><input className="form-check-input" id="new-group-private" type="checkbox" checked={createForm.isPrivate} onChange={(event) => setCreateForm({ ...createForm, isPrivate: event.target.checked })} />
            <label className="form-check-label" htmlFor="new-group-private">{t('Private group')}</label></div>
          <button className="btn btn-primary" type="submit" disabled={busy}>{t(busy ? 'Creating…' : 'Create group')}</button>
        </div>
      </form>}
      <form className="input-group mb-4" role="search" onSubmit={submitSearch}>
        <label className="visually-hidden" htmlFor="group-search">{t('Search groups')}</label>
        <input id="group-search" className="form-control" type="search" placeholder={t('Search by group or course')} value={search} onChange={(event) => setSearch(event.target.value)} />
        <button className="btn btn-outline-primary" type="submit">{t('Search')}</button>
      </form>
      {loading ? <LoadingState label="Loading groups…" /> : error ? <ErrorState message={error} onRetry={retryGroups} /> : groups.length === 0
        ? <EmptyState title={query ? 'No matching groups' : 'No groups available'} description={query ? 'Try a different search.' : 'Groups will appear here when they are available.'} />
        : <div className="row g-3">
          {groups.map((group, index) => {
            const id = getRecordId(group)
            const joined = group.isMember === true || group.joined === true || group.membershipStatus === 'member'
            return <div className="col-12 col-md-6 col-xl-4" key={id || `${getRecordTitle(group)}-${index}`}>
              <article className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between gap-2 align-items-start">
                    <h2 className="h5">{getRecordTitle(group)}</h2>
                    {joined && <span className="badge text-bg-success">{t('Joined')}</span>}
                  </div>
                  {(group.course || group.subject) && <p className="small text-body-secondary">{group.course || group.subject}</p>}
                  <p>{group.description || t('No group description provided.')}</p>
                  {group.memberCount !== undefined && <p className="small text-body-secondary mb-0">{group.memberCount} {t('members')}</p>}
                </div>
                <div className="card-footer bg-body">
                  {id ? <Link className="btn btn-sm btn-outline-primary" to={`/student/groups/${encodeURIComponent(id)}`}>{t('View group')}</Link> : <span className="small text-body-secondary">{t('Group details unavailable')}</span>}
                </div>
              </article>
            </div>
          })}
        </div>}
    </main>
  )
}
