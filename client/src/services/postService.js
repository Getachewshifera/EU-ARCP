import api from './api.js'

function getImageUrl(id) {
  const apiUrl = new URL(import.meta.env.VITE_API_URL || '/api', window.location.origin)
  const basePath = apiUrl.pathname.replace(/\/+$/, '')
  return `${apiUrl.origin}${basePath}/posts/${encodeURIComponent(id)}/image`
}

const postService = {
  listPublished() {
    return api.get('/posts')
  },

  getAdminImage(id) {
    return api.get(`/posts/admin/${encodeURIComponent(id)}/image`, { responseType: 'blob' })
  },

  getImageUrl,
}

export default postService
