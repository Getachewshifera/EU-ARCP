import { useState } from 'react'
import AdminResourcePage from '../../components/admin/AdminResourcePage.jsx'

const structures = {
  colleges: {
    label: 'Colleges',
    fields: [
      { name: 'name', label: 'College name', required: true },
      { name: 'universityId', label: 'University ID', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  departments: {
    label: 'Departments',
    fields: [
      { name: 'name', label: 'Department name', required: true },
      { name: 'collegeId', label: 'College ID', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  programs: {
    label: 'Programs',
    fields: [
      { name: 'name', label: 'Program name', required: true },
      { name: 'departmentId', label: 'Department ID', required: true },
      { name: 'degree', label: 'Degree' },
    ],
  },
  courses: {
    label: 'Courses',
    fields: [
      { name: 'code', label: 'Course code', required: true },
      { name: 'title', label: 'Course title', required: true },
      { name: 'programId', label: 'Program ID', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
}

function AcademicStructure() {
  const [entity, setEntity] = useState('colleges')
  const structure = structures[entity]

  return (
    <section>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Academic structure</h1>
          <p className="text-secondary mb-0">Manage colleges, departments, programs, and courses.</p>
        </div>
        <select
          aria-label="Academic structure type"
          className="form-select"
          onChange={(event) => setEntity(event.target.value)}
          value={entity}
        >
          {Object.entries(structures).map(([key, item]) => (
            <option key={key} value={key}>{item.label}</option>
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
