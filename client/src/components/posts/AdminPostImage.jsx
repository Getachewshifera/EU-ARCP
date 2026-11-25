import { useEffect, useRef, useState } from 'react'
import postService from '../../services/postService.js'

function AdminPostImage({ postId, className = '', alt = '' }) {
  const containerRef = useRef(null)
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return undefined
    if (!('IntersectionObserver' in window)) {
      const timer = window.setTimeout(() => setVisible(true), 0)
      return () => window.clearTimeout(timer)
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, { rootMargin: '100px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return undefined
    let active = true
    let objectUrl = ''
    postService.getAdminImage(postId)
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data)
        if (active) setImageUrl(objectUrl)
        else URL.revokeObjectURL(objectUrl)
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || requestError.message || 'Image unavailable.')
      })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [postId, visible])

  return (
    <span className="admin-image-loader" ref={containerRef}>
      {error ? <span className="small text-secondary" role="status">{error}</span>
        : imageUrl ? <img className={className} src={imageUrl} alt={alt} loading="lazy" />
          : <span className="small text-secondary" role="status">{visible ? 'Loading image…' : 'Image'}</span>}
    </span>
  )
}

export default AdminPostImage
