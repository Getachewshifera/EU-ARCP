export function unwrap(response) {
  const body = response?.data ?? response
  return body?.data ?? body
}

export function listFrom(value, ...keys) {
  if (Array.isArray(value)) return value
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key]
  }
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.results)) return value.results
  return []
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback
}

export function itemId(item) {
  return item?.id ?? item?._id ?? item?.uuid
}

export function displayDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString()
}
