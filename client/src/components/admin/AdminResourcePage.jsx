import { useCallback, useEffect, useMemo, useState } from 'react'
import adminService from '../../services/adminService.js'
import AdminDataTable from './AdminDataTable.jsx'
import { displayValue, getItems, getRecordId } from './adminData.js'

function AdminResourcePage({
  title,
  description,
  resource,
  fields,
  columns,
  createLabel = 'Add record',
}) {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({})
  const [editingId, setEditingId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await adminService.listResource(resource)
      setRows(getItems(response))
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load records.')
    } finally {
      setLoading(false)
    }
  }, [resource])

  useEffect(() => {
    let active = true

    async function loadInitialResource() {
      try {
        const response = await adminService.listResource(resource)
        if (active) setRows(getItems(response))
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || requestError.message || 'Unable to load records.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInitialResource()
    return () => { active = false }
  }, [resource])

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows

    return rows.filter((row) => (
      fields.some(({ name }) => displayValue(row[name]).toLowerCase().includes(query))
    ))
  }, [fields, rows, search])

  function startCreate() {
    setEditingId('')
    setForm(Object.fromEntries(fields.map(({ name, defaultValue }) => [name, defaultValue ?? ''])))
    setError('')
  }

  function startEdit(row) {
    setEditingId(getRecordId(row))
    setForm(Object.fromEntries(fields.map(({ name }) => {
      const value = row[name] ?? ''
      return [name, typeof value === 'object' && value !== null ? JSON.stringify(value) : value]
    })))
    setError('')
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submitForm(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editingId) {
        await adminService.updateResource(resource, editingId, form)
      } else {
        await adminService.createResource(resource, form)
      }

      setForm({})
      setEditingId('')
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to save this record.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteRecord(row) {
    const id = getRecordId(row)
    if (!id || !window.confirm('Delete this record? This action cannot be undone.')) return

    setError('')
    try {
      await adminService.deleteResource(resource, id)
      await load()
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to delete this record.')
    }
  }

  const tableColumns = columns ?? fields.map(({ name, label }) => ({ key: name, label }))

  return (
    <section>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">{title}</h1>
          <p className="text-secondary mb-0">{description}</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={startCreate}>
          {createLabel}
        </button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {(editingId || Object.keys(form).length > 0) && (
        <form className="card card-body mb-4" onSubmit={submitForm}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">{editingId ? 'Edit record' : 'Create record'}</h2>
            <button
              aria-label="Close form"
              className="btn-close"
              type="button"
              onClick={() => { setEditingId(''); setForm({}) }}
            />
          </div>
          <div className="row g-3">
            {fields.map((field) => (
              <div className={field.type === 'textarea' ? 'col-12' : 'col-md-6'} key={field.name}>
                <label className="form-label" htmlFor={`${resource}-${field.name}`}>
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    className="form-select"
                    id={`${resource}-${field.name}`}
                    required={field.required}
                    value={form[field.name] ?? ''}
                    onChange={(event) => updateField(field.name, event.target.value)}
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    className="form-control"
                    id={`${resource}-${field.name}`}
                    required={field.required}
                    rows="3"
                    value={form[field.name] ?? ''}
                    onChange={(event) => updateField(field.name, event.target.value)}
                  />
                ) : (
                  <input
                    className="form-control"
                    id={`${resource}-${field.name}`}
                    type={field.type || 'text'}
                    required={field.required}
                    value={form[field.name] ?? ''}
                    onChange={(event) => updateField(field.name, event.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary" disabled={saving} type="submit">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create'}
            </button>
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => { setEditingId(''); setForm({}) }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="card-header bg-white d-flex flex-wrap gap-2 justify-content-between align-items-center py-3">
          <span className="fw-semibold">{rows.length} records</span>
          <div className="d-flex gap-2">
            <input
              aria-label={`Search ${title.toLowerCase()}`}
              className="form-control"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records"
              type="search"
              value={search}
            />
            <button className="btn btn-outline-secondary" disabled={loading} onClick={load} type="button">
              Refresh
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-4 text-secondary" role="status">Loading records…</div>
        ) : (
          <AdminDataTable
            actions={(row) => (
              <>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => startEdit(row)} type="button">
                  Edit
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRecord(row)} type="button">
                  Delete
                </button>
              </>
            )}
            columns={tableColumns}
            emptyMessage={search ? 'No records match your search.' : 'No records have been added yet.'}
            rows={visibleRows}
          />
        )}
      </div>
    </section>
  )
}

export default AdminResourcePage
