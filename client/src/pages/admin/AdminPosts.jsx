import { useEffect, useState } from 'react'
import adminService from '../../services/adminService.js'
import AdminPostImage from '../../components/posts/AdminPostImage.jsx'
import useLanguage from '../../hooks/useLanguage.js'

const EMPTY_FORM = { title: '', content: '', status: 'published' }

function AdminPosts() {
  const { t } = useLanguage()
  const [posts, setPosts] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [image, setImage] = useState(null)
  const [editingId, setEditingId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadPosts() {
    try {
      const response = await adminService.getPosts()
      setPosts(response.data?.items || [])
      setError('')
    } catch (requestError) {
      setError(t(requestError.response?.data?.message || requestError.message || 'Unable to load posts.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    adminService.getPosts()
      .then((response) => {
        if (active) setPosts(response.data?.items || [])
      })
      .catch((requestError) => {
        if (active) setError(t(requestError.response?.data?.message || requestError.message || 'Unable to load posts.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [t])

  function startCreate() {
    setEditingId('')
    setForm(EMPTY_FORM)
    setImage(null)
    setFormOpen(true)
    setSuccess('')
  }

  function startEdit(post) {
    setEditingId(post._id)
    setForm({ title: post.title, content: post.content, status: post.status })
    setImage(null)
    setFormOpen(true)
    setSuccess('')
  }

  function closeForm() {
    setEditingId('')
    setForm(EMPTY_FORM)
    setImage(null)
    setFormOpen(false)
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    const payload = new FormData()
    payload.append('title', form.title)
    payload.append('content', form.content)
    payload.append('status', form.status)
    if (image) payload.append('image', image)

    try {
      if (editingId) await adminService.updatePost(editingId, payload)
      else await adminService.createPost(payload)
      setForm(EMPTY_FORM)
      setImage(null)
      setEditingId('')
      setFormOpen(false)
      setSuccess(editingId ? 'Post updated.' : 'Post created.')
      await loadPosts()
    } catch (requestError) {
      setError(t(requestError.response?.data?.message || requestError.message || 'Unable to save this post.'))
    } finally {
      setSaving(false)
    }
  }

  async function deletePost(post) {
    if (!window.confirm(`${t('Delete')} "${post.title}"? ${t('This cannot be undone.')}`)) return
    setError('')
    setSuccess('')
    try {
      await adminService.deletePost(post._id)
      setPosts((current) => current.filter((item) => item._id !== post._id))
      setSuccess('Post deleted.')
      if (editingId === post._id) closeForm()
    } catch (requestError) {
      setError(t(requestError.response?.data?.message || requestError.message || 'Unable to delete this post.'))
    }
  }

  return (
    <section className="admin-posts-page">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">{t('Posts')}</h1>
          <p className="text-secondary mb-0">{t('Create updates for the homepage and every role portal.')}</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={startCreate}>{t('Create post')}</button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}

      {formOpen && (
        <form className="card admin-post-form mb-4" onSubmit={submit}>
          <div className="card-body">
            <h2 className="h5 mb-3">{t(editingId ? 'Edit post' : 'New post')}</h2>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label" htmlFor="post-title">{t('Title')}</label>
                <input className="form-control" id="post-title" maxLength="160" name="title" onChange={updateField} required value={form.title} />
              </div>
              <div className="col-md-4">
                <label className="form-label" htmlFor="post-status">{t('Visibility')}</label>
                <select className="form-select" id="post-status" name="status" onChange={updateField} value={form.status}>
                  <option value="published">{t('Published')}</option>
                  <option value="draft">{t('Draft')}</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="post-content">{t('Post content')}</label>
                <textarea className="form-control" id="post-content" maxLength="10000" name="content" onChange={updateField} required rows="5" value={form.content} />
              </div>
              <div className="col-md-8">
                <label className="form-label" htmlFor="post-image">{t('Image (optional, JPEG/PNG/WebP, up to 5 MB)')}</label>
                <input accept="image/jpeg,image/png,image/webp" className="form-control" id="post-image" onChange={(event) => setImage(event.target.files?.[0] || null)} type="file" />
                {editingId && posts.find((post) => post._id === editingId)?.imageUrl && !image && (
                  <AdminPostImage key={editingId} className="admin-post-image-preview mt-2" postId={editingId} alt={t('Current post')} />
                )}
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <button className="btn btn-primary" disabled={saving} type="submit">
                {t(saving ? 'Saving…' : editingId ? 'Save changes' : form.status === 'published' ? 'Publish post' : 'Save draft')}
              </button>
              <button className="btn btn-outline-secondary" onClick={closeForm} type="button">{t('Cancel')}</button>
              {image && <span className="align-self-center small text-secondary">{image.name}</span>}
            </div>
          </div>
        </form>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0">{t('All posts')} <span className="text-secondary">({posts.length})</span></h2>
        <button className="btn btn-outline-secondary btn-sm" disabled={loading} onClick={() => { setLoading(true); void loadPosts() }} type="button">{t('Refresh')}</button>
      </div>
      {loading ? <div className="card card-body text-secondary" role="status">{t('Loading posts…')}</div> : posts.length ? (
        <div className="row g-3">
          {posts.map((post) => (
            <div className="col-12 col-xl-6" key={post._id}>
              <article className="card h-100 admin-post-card">
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div className="min-w-0">
                      <span className={`badge ${post.status === 'published' ? 'text-bg-success' : 'text-bg-secondary'}`}>                      {t(post.status === 'published' ? 'Published' : 'Draft')}</span>
                      <h3 className="h5 mt-2">{post.title}</h3>
                    </div>
                    {post.imageUrl && <AdminPostImage className="admin-post-thumbnail" postId={post._id} />}
                  </div>
                  <p className="admin-post-excerpt mb-3">{post.content}</p>
                  <div className="d-flex flex-wrap gap-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(post)} type="button">{t('Edit')}</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deletePost(post)} type="button">{t('Delete')}</button>
                    <small className="align-self-center text-secondary ms-auto">
                      {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : ''}
                    </small>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      ) : <div className="card card-body text-secondary">{t('No posts yet. Create one to share an update.')}</div>}
    </section>
  )
}

export default AdminPosts
