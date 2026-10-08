export function getItems(response) {
  const payload = response?.data
  const items = Array.isArray(payload)
    ? payload
    : payload?.items ?? payload?.results ?? payload?.data

  if (!Array.isArray(items)) {
    throw new Error('The API response did not contain a list of records.')
  }

  return items
}

export function getRecordId(record) {
  const id = record?._id ?? record?.id
  return id == null ? '' : String(id)
}

export function displayValue(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return value.name ?? value.title ?? value.email ?? '—'
  return String(value)
}

export function formatAdminDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? displayValue(value) : date.toLocaleString()
}
