// Purpose: Public account registration page.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthPage from '../../components/auth/AuthPage.jsx'
import adminService from '../../services/adminService.js'
import authService from '../../services/authService.js'

const initialForm = {
  role: 'student',
  firstName: '',
  middleName: '',
  lastName: '',
  universityId: '',
  collegeId: '',
  departmentId: '',
  programId: '',
  academicYear: '',
  identityId: '',
  email: '',
  phone: '',
  profilePhoto: null,
}

const academicYearOptions = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Graduate', 'PhD']

const fallbackAcademicData = {
  'Addis Ababa University': {
    colleges: ['College of Business and Economics', 'College of Social Sciences', 'College of Health Sciences', 'College of Natural and Computational Sciences'],
    departments: ['Business Administration', 'Economics', 'Accounting', 'Psychology', 'Sociology', 'Computer Science', 'Statistics', 'Biology', 'Chemistry', 'Nursing']
  },
  'Addis Ababa Science and Technology University': {
    colleges: ['College of Engineering', 'College of Applied Sciences', 'College of Architecture and Construction'],
    departments: ['Civil Engineering', 'Mechanical Engineering', 'Computer Engineering', 'Architecture', 'Construction Management', 'Electrical Engineering']
  },
  'Adama Science and Technology University': {
    colleges: ['College of Engineering', 'College of Agriculture', 'College of Business and Economics'],
    departments: ['Computer Science', 'Civil Engineering', 'Electrical Engineering', 'Agricultural Economics', 'Soil Science', 'Business Administration']
  },
  'Aksum University': {
    colleges: ['College of Business and Economics', 'College of Social Sciences and Humanities', 'College of Health Sciences'],
    departments: ['Marketing Management', 'Economics', 'English Language', 'Sociology', 'Public Health', 'Civil Engineering']
  },
  'Ambo University': {
    colleges: ['College of Natural and Computational Sciences', 'College of Education and Behavioral Studies', 'College of Agriculture and Veterinary Sciences'],
    departments: ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'Education', 'Animal Science']
  },
  'Arba Minch University': {
    colleges: ['College of Natural Sciences', 'College of Business and Economics', 'College of Engineering'],
    departments: ['Computer Science', 'Business Administration', 'Economics', 'Civil Engineering', 'Geology', 'English Language']
  },
  'Bahir Dar University': {
    colleges: ['College of Agriculture and Environmental Sciences', 'College of Science', 'College of Business and Economics'],
    departments: ['Agronomy', 'Plant Science', 'Biology', 'Chemistry', 'Economics', 'Accounting', 'Mathematics']
  },
  'Hawassa University': {
    colleges: ['College of Agriculture', 'College of Social Sciences and Humanities', 'College of Medicine and Health Sciences'],
    departments: ['Agricultural Extension', 'Sociology', 'Public Health', 'Computer Science', 'Biology', 'Chemistry']
  },
  'Jimma University': {
    colleges: ['College of Agriculture and Veterinary Medicine', 'College of Business and Economics', 'College of Health Sciences'],
    departments: ['Veterinary Medicine', 'Agronomy', 'Business Administration', 'Economics', 'Nursing', 'Biology']
  },
  'Mekelle University': {
    colleges: ['College of Engineering', 'College of Health Sciences', 'College of Business and Economics'],
    departments: ['Civil Engineering', 'Mechanical Engineering', 'Nursing', 'Public Health', 'Business Administration', 'Computer Science']
  },
  'University of Gondar': {
    colleges: ['College of Medicine and Health Sciences', 'College of Social Sciences and Humanities', 'College of Natural and Computational Sciences'],
    departments: ['Medicine', 'Nursing', 'Public Health', 'Psychology', 'Chemistry', 'Physics']
  },
  'Wollo University': {
    colleges: ['College of Business and Economics', 'College of Social Sciences and Humanities', 'College of Science and Technology'],
    departments: ['Business Administration', 'Accounting', 'Economics', 'English Language', 'Computer Science', 'Mathematics']
  }
}

const fallbackUniversities = [
  'Addis Ababa University',
  'Addis Ababa Science and Technology University',
  'Adama Science and Technology University',
  'Afar Region University',
  'Aksum University',
  'Ambo University',
  'Arba Minch University',
  'Asosa University',
  'Bahir Dar University',
  'Bule Hora University',
  'Debre Berhan University',
  'Debre Markos University',
  'Dilla University',
  'Dire Dawa University',
  'Ethiopian Civil Service University',
  'Ethiopian Institute of Architecture, Building Construction and City Development',
  'Ethiopian Management Institute',
  'Gambella University',
  'Haramaya University',
  'Hawassa University',
  'Jimma University',
  'Jinka University',
  'Kotebe University of Education',
  'Madda Walabu University',
  'Mekelle University',
  'Metu University',
  'Mizan-Tepi University',
  'Oda Bultum University',
  'Rift Valley University',
  'Samara University',
  'Semera University',
  'St. Mary University',
  'Sodo University',
  'University of Gondar',
  'Unity University',
  'Wachemo University',
  'Wolaita Sodo University',
  'Wollo University',
  'Wollega University',
  'Wolkite University',
]

function Register() {
  const [form, setForm] = useState(initialForm)
  const [universities, setUniversities] = useState([])
  const [colleges, setColleges] = useState([])
  const [departments, setDepartments] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState({ universities: true, colleges: false, departments: false, programs: false })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let ignore = false

    async function loadUniversities() {
      try {
        setLoading((current) => ({ ...current, universities: true }))
        const response = await adminService.listResource('universities')
        const items = Array.isArray(response.data?.items) ? response.data.items : []
        const next = items.length ? items : fallbackUniversities.map((name, index) => ({ _id: `fallback-${index}`, name }))
        if (!ignore) {
          setUniversities(next)
          setError('')
        }
      } catch (loadError) {
        if (!ignore) {
          setUniversities(fallbackUniversities.map((name, index) => ({ _id: `fallback-${index}`, name })))
          setError('')
        }
      } finally {
        if (!ignore) setLoading((current) => ({ ...current, universities: false }))
      }
    }

    loadUniversities()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!form.universityId) {
      setColleges([])
      setDepartments([])
      setPrograms([])
      setForm((current) => ({ ...current, collegeId: '', departmentId: '' }))
      return
    }

    let ignore = false

    async function loadColleges() {
      try {
        setLoading((current) => ({ ...current, colleges: true }))
        const response = await adminService.listResource('colleges', { university: form.universityId })
        const items = Array.isArray(response.data?.items) ? response.data.items : []
        const selectedUniversity = universities.find((entry) => entry._id === form.universityId)
        const fallbackList = (selectedUniversity && fallbackAcademicData[selectedUniversity.name]?.colleges) || []
        const next = items.length ? items : fallbackList.map((name, index) => ({ _id: `fallback-college-${form.universityId}-${index}`, name }))
        if (!ignore) setColleges(next)
      } catch (loadError) {
        const selectedUniversity = universities.find((entry) => entry._id === form.universityId)
        const fallbackList = (selectedUniversity && fallbackAcademicData[selectedUniversity.name]?.colleges) || []
        if (!ignore) setColleges(fallbackList.map((name, index) => ({ _id: `fallback-college-${form.universityId}-${index}`, name })))
      } finally {
        if (!ignore) setLoading((current) => ({ ...current, colleges: false }))
      }
    }

    loadColleges()
    return () => {
      ignore = true
    }
  }, [form.universityId])

  useEffect(() => {
    if (!form.collegeId) {
      setDepartments([])
      setPrograms([])
      setForm((current) => ({ ...current, departmentId: '', programId: '' }))
      return
    }

    let ignore = false

    async function loadDepartments() {
      try {
        setLoading((current) => ({ ...current, departments: true }))
        const response = await adminService.listResource('departments', { college: form.collegeId, university: form.universityId })
        const items = Array.isArray(response.data?.items) ? response.data.items : []
        const selectedUniversity = universities.find((entry) => entry._id === form.universityId)
        const fallbackList = (selectedUniversity && fallbackAcademicData[selectedUniversity.name]?.departments) || []
        const next = items.length ? items : fallbackList.map((name, index) => ({ _id: `fallback-department-${form.departmentId || form.collegeId || form.universityId}-${index}`, name }))
        if (!ignore) setDepartments(next)
      } catch (loadError) {
        const selectedUniversity = universities.find((entry) => entry._id === form.universityId)
        const fallbackList = (selectedUniversity && fallbackAcademicData[selectedUniversity.name]?.departments) || []
        if (!ignore) setDepartments(fallbackList.map((name, index) => ({ _id: `fallback-department-${form.departmentId || form.collegeId || form.universityId}-${index}`, name })))
      } finally {
        if (!ignore) setLoading((current) => ({ ...current, departments: false }))
      }
    }

    loadDepartments()
    return () => {
      ignore = true
    }
  }, [form.collegeId, form.universityId])

  useEffect(() => {
    if (!form.departmentId) {
      setPrograms([])
      setForm((current) => ({ ...current, programId: '' }))
      return
    }

    let ignore = false

    async function loadPrograms() {
      try {
        setLoading((current) => ({ ...current, programs: true }))
        const response = await adminService.listResource('programs', { department: form.departmentId })
        const items = Array.isArray(response.data?.items) ? response.data.items : []
        const fallbackPrograms = items.length ? items : [{ _id: `fallback-program-${form.departmentId}`, department: form.departmentId, name: 'General Program' }]
        if (!ignore) {
          setPrograms(fallbackPrograms)
          const selectedProgram = fallbackPrograms[0]
          if (selectedProgram && selectedProgram._id !== form.programId) {
            setForm((current) => ({ ...current, programId: selectedProgram._id }))
          }
        }
      } catch (loadError) {
        if (!ignore) {
          const fallbackPrograms = [{ _id: `fallback-program-${form.departmentId}`, department: form.departmentId, name: 'General Program' }]
          setPrograms(fallbackPrograms)
          setForm((current) => ({ ...current, programId: fallbackPrograms[0]._id }))
        }
      } finally {
        if (!ignore) setLoading((current) => ({ ...current, programs: false }))
      }
    }

    loadPrograms()
    return () => {
      ignore = true
    }
  }, [form.departmentId])

  function update(event) {
    const { name, value, files } = event.target
    setForm((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }))
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting) return
    setError('')
    setNotice('')

    const isStudent = form.role === 'student'
    const requiredFields = [
      form.firstName,
      form.middleName,
      form.lastName,
      form.universityId,
      form.collegeId,
      form.departmentId,
      form.identityId,
      form.email,
      form.profilePhoto,
    ]

    if (isStudent) requiredFields.push(form.academicYear)

    if (requiredFields.some((value) => value === null || value === undefined || (typeof value === 'string' && value.trim() === ''))) {
      setError('Please complete all required fields before submitting your registration.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Enter a valid email address.')
      return
    }

    if (form.phone && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s0-9]{6,}$/.test(form.phone)) {
      setError('Enter a valid phone number.')
      return
    }

    setSubmitting(true)

    try {
      const payload = new FormData()
      payload.append('firstName', form.firstName)
      payload.append('middleName', form.middleName)
      payload.append('lastName', form.lastName)
      payload.append('universityId', form.universityId)
      payload.append('collegeId', form.collegeId)
      payload.append('departmentId', form.departmentId)
      if (programs.length > 0 && !programs.some((program) => program._id === form.programId)) {
        payload.append('programId', programs[0]._id)
      } else if (form.programId) {
        payload.append('programId', form.programId)
      }
      payload.append('identityId', form.identityId)
      payload.append('email', form.email)
      if (form.phone) payload.append('phone', form.phone)
      if (isStudent) payload.append('academicYear', form.academicYear)
      payload.append('profilePhoto', form.profilePhoto)

      const register = form.role === 'lecturer' ? authService.registerLecturer : authService.registerStudent
      const response = await register(payload)
      const data = response.data?.data ?? response.data ?? {}
      const email = data.email || form.email

      if (data.requiresVerification || data.otpSent) {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=registration`)
        return
      }

      if (isStudent && data.status === 'pending') {
        navigate(`/registration-status?email=${encodeURIComponent(email)}`)
        return
      }

      setNotice(data.message || 'Registration submitted successfully. You can sign in after your account is approved.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to submit registration.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPage description="Create an account to collaborate with your academic community." title="Create your account">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      <form className="vstack gap-3" onSubmit={submit}>
        <div>
          <label className="form-label" htmlFor="register-role">Account type</label>
          <select className="form-select" disabled={submitting} id="register-role" name="role" onChange={(event) => {
            const role = event.target.value
            setForm({ ...initialForm, role })
          }} value={form.role}>
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
          </select>
        </div>

        <div className="row g-3">
          {['firstName', 'middleName', 'lastName'].map((name) => (
            <div className="col-sm-4" key={name}>
              <label className="form-label" htmlFor={`register-${name}`}>{
                name === 'firstName' ? 'First name' : name === 'middleName' ? 'Middle name' : 'Last name'
              }</label>
              <input autoComplete={name === 'firstName' ? 'given-name' : name === 'middleName' ? 'additional-name' : 'family-name'} className="form-control" disabled={submitting} id={`register-${name}`} name={name} onChange={update} required value={form[name]} />
            </div>
          ))}
        </div>

        <div>
          <label className="form-label" htmlFor="register-university">University</label>
          <select className="form-select" disabled={submitting || loading.universities} id="register-university" name="universityId" onChange={(event) => {
            setForm((current) => ({ ...current, universityId: event.target.value, collegeId: '', departmentId: '', academicYear: '' }))
          }} required value={form.universityId}>
            <option value="">Select your university</option>
            {universities.map((university) => (
              <option key={university._id} value={university._id}>{university.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label" htmlFor="register-college">College or school</label>
          <select className="form-select" disabled={submitting || loading.colleges || !form.universityId} id="register-college" name="collegeId" onChange={(event) => {
            setForm((current) => ({ ...current, collegeId: event.target.value, departmentId: '', programId: '' }))
          }} required value={form.collegeId}>
            <option value="">Select your college</option>
            {colleges.map((college) => (
              <option key={college._id} value={college._id}>{college.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label" htmlFor="register-department">Department</label>
          <select className="form-select" disabled={submitting || loading.departments || !form.collegeId} id="register-department" name="departmentId" onChange={(event) => {
            setForm((current) => ({ ...current, departmentId: event.target.value, programId: '' }))
          }} required value={form.departmentId}>
            <option value="">Select your department</option>
            {departments.map((department) => (
              <option key={department._id} value={department._id}>{department.name}</option>
            ))}
          </select>
        </div>

        {form.role === 'student' && (
          <div>
            <label className="form-label" htmlFor="register-academic-year">Academic year or current study year</label>
            <select className="form-select" disabled={submitting} id="register-academic-year" name="academicYear" onChange={update} required value={form.academicYear}>
              <option value="">Select academic year</option>
              {academicYearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="form-label" htmlFor="register-identity-id">{form.role === 'student' ? 'University ID' : 'Lecturer ID'}</label>
          <input className="form-control" disabled={submitting} id="register-identity-id" name="identityId" onChange={update} required value={form.identityId} />
        </div>

        <div>
          <label className="form-label" htmlFor="register-email">Email address</label>
          <input autoComplete="email" className="form-control" disabled={submitting} id="register-email" name="email" onChange={update} required type="email" value={form.email} />
        </div>

        <div>
          <label className="form-label" htmlFor="register-phone">Phone number (optional)</label>
          <input autoComplete="tel" className="form-control" disabled={submitting} id="register-phone" name="phone" onChange={update} type="tel" value={form.phone} />
        </div>

        <div>
          <label className="form-label" htmlFor="register-profile-photo">Profile photo</label>
          <input accept="image/png,image/jpeg" className="form-control" disabled={submitting} id="register-profile-photo" name="profilePhoto" onChange={update} required type="file" />
        </div>

        <button className="btn btn-primary btn-lg" disabled={submitting || loading.universities} type="submit">
          {submitting ? 'Submitting…' : 'Create account'}
        </button>
      </form>
      <p className="text-secondary text-center mt-4 mb-0">Already registered? <Link to="/login">Sign in</Link></p>
    </AuthPage>
  )
}

export default Register
