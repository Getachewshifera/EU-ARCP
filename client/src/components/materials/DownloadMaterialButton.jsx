// Purpose: Requests a short-lived authorized document download link.
import { useState } from 'react'
import materialService from '../../services/materialService.js'
import useLanguage from '../../hooks/useLanguage.js'

function DownloadMaterialButton({ materialId, fileName, className = 'btn btn-primary', label = 'Download' }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function download() {
    setLoading(true)
    setError('')
    let downloadWindow = null
    try {
      downloadWindow = window.open('about:blank', '_blank')
      if (downloadWindow) downloadWindow.opener = null
      const response = await materialService.getDownloadUrl(materialId)
      const payload = response?.data?.data ?? response?.data
      if (payload?.url) {
        if (downloadWindow) downloadWindow.location = payload.url
        else window.location.assign(payload.url)
      } else if (payload?.legacy) {
        const fileResponse = await materialService.getLegacyFile(materialId)
        const objectUrl = URL.createObjectURL(fileResponse.data)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = fileName || 'material'
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
        downloadWindow?.close()
      } else {
        throw new Error('The server did not return a temporary download link.')
      }
    } catch (requestError) {
      downloadWindow?.close()
      setError(requestError.response?.data?.message || requestError.message || 'Unable to download this material.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <span className="d-inline-flex flex-column align-items-start gap-1">
      <button className={className} type="button" disabled={loading || !materialId} onClick={download}>
        {t(loading ? 'Preparing download…' : label)}
      </button>
      {error && <span className="small text-danger" role="alert">{t(error)}</span>}
    </span>
  )
}

export default DownloadMaterialButton
