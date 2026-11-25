import { useState } from 'react'
import AdminResourcePage from '../../components/admin/AdminResourcePage.jsx'
import useLanguage from '../../hooks/useLanguage.js'

const structures = {
  colleges: {
    label: 'Colleges',
    fields: [
      { name: 'name', label: 'College name', required: true, maxLength: 160 },
      { name: 'university', label: 'University', type: 'select', optionsResource: 'universities', required: true },
      { name: 'description', label: 'Description', type: 'textarea', maxLength: 2000 },
    ],
  },
  departments: {
    label: 'Departments',
    fields: [
      { name: 'name', label: 'Department name', required: true, maxLength: 160 },
      { name: 'university', label: 'University', type: 'select', optionsResource: 'universities', required: true },
      { name: 'college', label: 'College', type: 'select', optionsResource: 'colleges', dependsOn: 'university', optionParentField: 'university', required: true },
      { name: 'description', label: 'Description', type: 'textarea', maxLength: 2000 },
    ],
  },
  programs: {
    label: 'Programs',
    fields: [
      { name: 'name', label: 'Program name', required: true, maxLength: 160 },
      { name: 'department', label: 'Department', type: 'select', optionsResource: 'departments', required: true },
      { name: 'degree', label: 'Degree', maxLength: 80 },
      { name: 'duration', label: 'Duration in years', type: 'number', min: 1, max: 20 },
      { name: 'description', label: 'Description', type: 'textarea', maxLength: 2000 },
    ],
  },
  courses: {
    label: 'Courses',
    fields: [
      { name: 'name', label: 'Course name', required: true, maxLength: 160 },
      { name: 'code', label: 'Course code', maxLength: 30 },
      { name: 'department', label: 'Department', type: 'select', optionsResource: 'departments' },
      { name: 'program', label: 'Program', type: 'select', optionsResource: 'programs', dependsOn: 'department', optionParentField: 'department' },
      { name: 'semester', label: 'Semester', maxLength: 80 },
      { name: 'year', label: 'Year', type: 'number', min: 1, max: 20 },
      { name: 'description', label: 'Description', type: 'textarea', maxLength: 2000 },
    ],
  },
}

function AcademicStructure() {
  const { t } = useLanguage()
  const [entity, setEntity] = useState('colleges')
  const structure = structures[entity]

  return (
    <section>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">{t('Academic structure')}</h1>
          <p className="text-secondary mb-0">{t('Manage colleges, departments, programs, and courses.')}</p>
        </div>
        <select
          aria-label={t('Academic structure type')}
          className="form-select"
          onChange={(event) => setEntity(event.target.value)}
          value={entity}
        >
          {Object.entries(structures).map(([key, item]) => (
            <option key={key} value={key}>{t(item.label)}</option>
          ))}
        </select>
      </div>
      <AdminResourcePage
        key={entity}
        createLabel={`Add ${structure.label.toLowerCase().slice(0, -1)}`}
        description={`Create, update, or remove ${structure.label.toLowerCase()} in the directory.`}
        fields={structure.fields}
        resource={entity}
        title={structure.label}
      />
    </section>
  )
}

export default AcademicStructure
