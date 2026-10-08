import { useCallback, useEffect, useState } from 'react'
import { getItems } from '../components/admin/adminData.js'

function useAdminRecords(fetcher) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadInitialRecords() {
      try {
        const response = await fetcher()
        if (active) setRecords(getItems(response))
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || requestError.message || 'Unable to load records.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInitialRecords()
    return () => { active = false }
  }, [fetcher])

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetcher()
      setRecords(getItems(response))
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load records.')
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  const runAction = useCallback(async (recordId, action) => {
    setBusyId(String(recordId))
    setError('')
    try {
      await action()
      await reload()
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to complete this action.')
    } finally {
      setBusyId('')
    }
  }, [reload])

  return { records, loading, busyId, error, setError, reload, runAction }
}

export default useAdminRecords
