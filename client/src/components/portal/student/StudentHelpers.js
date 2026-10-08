export function unwrap(response) {
  return response && Object.prototype.hasOwnProperty.call(response, 'data')
    ? response.data
    : response
}

export function asList(response, keys = []) {
  const value = unwrap(response)
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  for (const key of [...keys, 'items', 'results', 'data']) {
    if (Array.isArray(value[key])) return value[key]
    if (value[key] && typeof value[key] === 'object') {
      const nested = asList(value[key], keys)
      if (nested.length) return nested
    }
  }
  return []
}

export function asEntity(response, keys = []) {
  let value = unwrap(response)
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  for (const key of [...keys, 'item', 'data']) {
    const nested = value[key]
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      value = nested
      break
    }
  }
  return value
}

export function getErrorMessage(error) {
  return error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || 'Something went wrong. Please try again.'
}

export function getRecordId(record) {
  return record?._id ?? record?.id ?? record?.uuid ?? ''
}

export function getRecordTitle(record) {
  return record?.title ?? record?.name ?? record?.subject ?? 'Untitled'
}

export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

export function displayPerson(person) {
  if (typeof person === 'string') return person
  return person?.name
    || [person?.firstName, person?.lastName].filter(Boolean).join(' ')
    || person?.email
    || ''
}
