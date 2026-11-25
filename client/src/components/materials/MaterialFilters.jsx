// Purpose: Filter material results by category and academic scope.
import { useEffect, useState } from 'react'
import materialService from '../../services/materialService.js'
import useLanguage from '../../hooks/useLanguage.js'

function getItems(response) {
  const payload = response?.data?.data ?? response?.data ?? response
  const items = Array.isArray(payload) ? payload : payload?.items ?? payload?.results
  return Array.isArray(items) ? items : []
}

function MaterialFilters({ filters, onChange }) {
  const { t } = useLanguage()
  const [options, setOptions] = useState({ categories: [], universities: [], departments: [] })
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      materialService.listCategories(),
      materialService.listUniversities(),
      materialService.listDepartments(),
    ]).then(([categories, universities, departments]) => {
      if (active) {
        setOptions({
          categories: getItems(categories),
          universities: getItems(universities),
          departments: getItems(departments),
        })
      }
    }).catch(() => {
      if (active) setError('Unable to load material filters.')
    })
    return () => { active = false }
  }, [])

  const departments = filters.university
    ? options.departments.filter((department) => {
      const universityId = department.university?._id ?? department.university
      return !universityId || String(universityId) === String(filters.university)
    })
    : options.departments

  function update(field, value) {
    const next = { ...filters, [field]: value }
    if (field === 'university') next.department = ''
    onChange(next)
  }

  return (
    <div className="row g-2 mb-3">
      <div className="col-12 col-md-4">
        <label className="form-label" htmlFor="material-filter-category">{t('Category')}</label>
        <select id="material-filter-category" className="form-select" value={filters.category || ''} onChange={(event) => update('category', event.target.value)}>
          <option value="">{t('All categories')}</option>
          {options.categories.map((category) => <option key={category._id || category.id} value={category._id || category.id}>{category.name}</option>)}
        </select>
      </div>
      <div className="col-12 col-md-4">
        <label className="form-label" htmlFor="material-filter-university">{t('University')}</label>
        <select id="material-filter-university" className="form-select" value={filters.university || ''} onChange={(event) => update('university', event.target.value)}>
          <option value="">{t('All universities')}</option>
          {options.universities.map((university) => <option key={university._id || university.id} value={university._id || university.id}>{university.name}</option>)}
        </select>
      </div>
      <div className="col-12 col-md-4">
        <label className="form-label" htmlFor="material-filter-department">{t('Department')}</label>
        <select id="material-filter-department" className="form-select" value={filters.department || ''} onChange={(event) => update('department', event.target.value)}>
          <option value="">{t('All departments')}</option>
          {departments.map((department) => <option key={department._id || department.id} value={department._id || department.id}>{department.name}</option>)}
        </select>
      </div>
      {error && <div className="col-12"><div className="small text-danger" role="status">{t(error)}</div></div>}
    </div>
  )
}

export default MaterialFilters
