import { useCallback, useEffect, useMemo, useState } from 'react'
import adminService from '../../services/adminService.js'
import AdminDataTable from './AdminDataTable.jsx'
import { displayValue, getItems, getRecordId } from './adminData.js'
import useLanguage from '../../hooks/useLanguage.js'

function getFieldDefaultValue(field) {
  if (field.defaultValue !== undefined) {
    return Array.isArray(field.defaultValue) ? [...field.defaultValue] : field.defaultValue
  }
  if (field.type === 'checkbox') return false
  return ''
}

function getOptionValue(value) {
  if (value && typeof value === 'object') return getRecordId(value)
  return value == null ? '' : String(value)
}

function getOptionLabel(option, labelField = 'name') {
  return option[labelField]
    || [option.firstName, option.middleName, option.lastName].filter(Boolean).join(' ')
    || option.email
    || getRecordId(option)
}

function AdminResourcePage({
  title,
  description,
  resource,
  fields,
  columns,
  createLabel = 'Add record',
}) {
  const { t } = useLanguage()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({})
  const [editingId, setEditingId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldOptions, setFieldOptions] = useState({})
  const [optionsError, setOptionsError] = useState('')
  const optionResources = useMemo(
    () => [...new Set(fields.map((field) => field.optionsResource).filter(Boolean))],
    [fields],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await adminService.listResource(resource, { limit: 500 })
      setRows(getItems(response))
    } catch (requestError) {
      setError(t(requestError.response?.data?.message || requestError.message || 'Unable to load records.'))
    } finally {
      setLoading(false)
    }
  }, [resource, t])

  useEffect(() => {
    let active = true

    async function loadInitialResource() {
      try {
        const response = await adminService.listResource(resource, { limit: 500 })
        if (active) setRows(getItems(response))
      } catch (requestError) {
        if (active) {
          setError(t(requestError.response?.data?.message || requestError.message || 'Unable to load records.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInitialResource()
    return () => { active = false }
  }, [resource, t])

  useEffect(() => {
    let active = true

    async function loadFieldOptions() {
      try {
        const entries = await Promise.all(optionResources.map(async (optionResource) => {
          const response = await adminService.listResource(optionResource, { limit: 500 })
          return [optionResource, getItems(response)]
        }))
        if (active) {
          setFieldOptions(Object.fromEntries(entries))
          setOptionsError('')
        }
      } catch (requestError) {
        if (active) {
          setOptionsError(t(requestError.response?.data?.message || requestError.message || 'Unable to load selection options.'))
        }
      }
    }

    if (optionResources.length > 0) loadFieldOptions()

    return () => { active = false }
  }, [optionResources, t])

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows

    return rows.filter((row) => (
      fields.some(({ name }) => displayValue(row[name]).toLowerCase().includes(query))
    ))
  }, [fields, rows, search])

  function startCreate() {
    setEditingId('')
    setForm(Object.fromEntries(fields.map((field) => [field.name, getFieldDefaultValue(field)])))
    setError('')
  }

  function startEdit(row) {
    setEditingId(getRecordId(row))
    setForm(Object.fromEntries(fields.map((field) => {
      const value = row[field.name]
      if (field.type === 'checkbox') return [field.name, Boolean(value)]
      return [field.name, value == null ? getFieldDefaultValue(field) : getOptionValue(value)]
    })))
    setError('')
  }

  function updateField(name, value) {
    setForm((current) => {
      const next = { ...current, [name]: value }
      fields.filter((field) => field.dependsOn === name)
        .forEach((field) => { next[field.name] = getFieldDefaultValue(field) })
      return next
    })
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
      setError(t(requestError.response?.data?.message || requestError.message || 'Unable to save this record.'))
    } finally {
      setSaving(false)
    }
  }

  async function deleteRecord(row) {
    const id = getRecordId(row)
    if (!id || !window.confirm(t('Delete this record? This action cannot be undone.'))) return

    setError('')
    try {
      await adminService.deleteResource(resource, id)
      await load()
    } catch (requestError) {
      setError(t(requestError.response?.data?.message || requestError.message || 'Unable to delete this record.'))
    }
  }

  const tableColumns = columns ?? fields.map((field) => ({
    key: field.name,
    label: field.label,
    render: (row) => {
      const value = row[field.name]
      if (field.optionsResource && value != null) {
        const values = Array.isArray(value) ? value : [value]
        const options = fieldOptions[field.optionsResource] || []
        const labels = values.map((entry) => {
          const option = options.find((item) => getRecordId(item) === getOptionValue(entry))
          return option ? getOptionLabel(option, field.optionLabel) : displayValue(entry)
        }).filter(Boolean)
        return labels.join(', ') || '—'
      }
      if (field.type === 'checkbox') return t(value ? 'Yes' : 'No')
      return displayValue(value)
    },
  }))

  return (
    <section>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">{t(title)}</h1>
          <p className="text-secondary mb-0">{t(description)}</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={startCreate}>
          {t(createLabel)}
        </button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {optionsError && <div className="alert alert-warning" role="alert">{optionsError}</div>}

      {(editingId || Object.keys(form).length > 0) && (
        <form className="card card-body mb-4" onSubmit={submitForm}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">{t(editingId ? 'Edit record' : 'Create record')}</h2>
            <button
              aria-label={t('Close form')}
              className="btn-close"
              type="button"
              onClick={() => { setEditingId(''); setForm({}) }}
            />
          </div>
          <div className="row g-3">
            {fields.map((field) => (
              <div className={field.type === 'textarea' ? 'col-12' : 'col-md-6'} key={field.name}>
                {field.type !== 'checkbox' && (
                  <label className="form-label" htmlFor={`${resource}-${field.name}`}>
                    {t(field.label)}
                  </label>
                )}
                {field.type === 'select' ? (
                  (() => {
                    const options = field.optionsResource ? fieldOptions[field.optionsResource] || [] : field.options || []
                    const parentValue = field.dependsOn ? form[field.dependsOn] : ''
                    const visibleOptions = field.optionParentField && parentValue
                      ? options.filter((option) => getOptionValue(option[field.optionParentField]) === String(parentValue))
                      : options
                    return (
                  <select
                    className="form-select"
                    disabled={Boolean(
                      (field.dependsOn && !parentValue)
                      || (field.optionsResource && !Array.isArray(fieldOptions[field.optionsResource])),
                    )}
                    id={`${resource}-${field.name}`}
                    required={field.required}
                    value={form[field.name] ?? ''}
                    onChange={(event) => updateField(field.name, event.target.value)}
                  >
                    <option value="">{t('Select')} {t(field.label.toLowerCase())}</option>
                    {visibleOptions.map((option) => {
                      const value = field.optionsResource ? getRecordId(option) : option.value
                      const label = field.optionsResource ? getOptionLabel(option, field.optionLabel) : option.label
                      return <option key={value} value={value}>{t(label)}</option>
                    })}
                  </select>
                    )
                  })()
                ) : field.type === 'checkbox' ? (
                  <div className="form-check">
                    <input
                      checked={Boolean(form[field.name])}
                      className="form-check-input"
                      id={`${resource}-${field.name}`}
                      onChange={(event) => updateField(field.name, event.target.checked)}
                      type="checkbox"
                    />
                    <label className="form-check-label" htmlFor={`${resource}-${field.name}`}>{t(field.checkboxLabel || field.label)}</label>
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    className="form-control"
                    id={`${resource}-${field.name}`}
                    maxLength={field.maxLength}
                    required={field.required}
                    rows="3"
                    value={form[field.name] ?? ''}
                    onChange={(event) => updateField(field.name, event.target.value)}
                  />
                ) : (
                  <input
                    className="form-control"
                    id={`${resource}-${field.name}`}
                    max={field.max}
                    maxLength={field.maxLength}
                    min={field.min}
                    minLength={field.minLength}
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
              {t(saving ? 'Saving…' : editingId ? 'Save changes' : 'Create')}
            </button>
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => { setEditingId(''); setForm({}) }}
            >
              {t('Cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="card-header bg-white d-flex flex-wrap gap-2 justify-content-between align-items-center py-3">
          <span className="fw-semibold">{rows.length} {t('records')}</span>
          <div className="d-flex gap-2">
            <input
              aria-label={`${t('Search')} ${t(title.toLowerCase())}`}
              className="form-control"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Search records')}
              type="search"
              value={search}
            />
            <button className="btn btn-outline-secondary" disabled={loading} onClick={load} type="button">
              {t('Refresh')}
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-4 text-secondary" role="status">{t('Loading records…')}</div>
        ) : (
          <AdminDataTable
            actions={(row) => (
              <>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => startEdit(row)} type="button">
                  {t('Edit')}
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteRecord(row)} type="button">
                  {t('Delete')}
                </button>
              </>
            )}
            columns={tableColumns}
            emptyMessage={t(search ? 'No records match your search.' : 'No records have been added yet.')}
            rows={visibleRows}
          />
        )}
      </div>
    </section>
  )
}

export default AdminResourcePage
