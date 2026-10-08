import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import studentService from '../../services/studentService.js'
import { asList, getErrorMessage, getRecordId, getRecordTitle } from '../../components/portal/student/StudentHelpers.js'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../../components/portal/student/StudentUi.jsx'

export default function Groups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

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

  return (
    <main className="container py-4">
      <PageHeader title="Study groups" description="Discover groups for your courses and interests." />
      <form className="input-group mb-4" role="search" onSubmit={submitSearch}>
        <label className="visually-hidden" htmlFor="group-search">Search groups</label>
        <input id="group-search" className="form-control" type="search" placeholder="Search by group or course" value={search} onChange={(event) => setSearch(event.target.value)} />
        <button className="btn btn-outline-primary" type="submit">Search</button>
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
                    {joined && <span className="badge text-bg-success">Joined</span>}
                  </div>
                  {(group.course || group.subject) && <p className="small text-body-secondary">{group.course || group.subject}</p>}
                  <p>{group.description || 'No group description provided.'}</p>
                  {group.memberCount !== undefined && <p className="small text-body-secondary mb-0">{group.memberCount} members</p>}
                </div>
                <div className="card-footer bg-body">
                  {id ? <Link className="btn btn-sm btn-outline-primary" to={`/student/groups/${encodeURIComponent(id)}`}>View group</Link> : <span className="small text-body-secondary">Group details unavailable</span>}
                </div>
              </article>
            </div>
          })}
        </div>}
    </main>
  )
}
