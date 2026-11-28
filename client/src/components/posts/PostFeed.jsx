import { useEffect, useState } from 'react'
import postService from '../../services/postService.js'
import useLanguage from '../../hooks/useLanguage.js'

function PostFeed({ compact = false, refreshKey }) {
  const { t, language } = useLanguage()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    postService.listPublished()
      .then((response) => {
        if (active) setPosts(response.data?.items || [])
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || requestError.message || 'Unable to load posts.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [refreshKey])

  if (loading || (!posts.length && !error)) return null

  return (
    <section className={`site-post-feed${compact ? ' site-post-feed-compact' : ''}`} aria-label={t('Platform posts')}>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div>
          <span className="site-post-eyebrow">{t('From the platform')}</span>
          <h2 className="h4 mb-0">{t('Latest posts')}</h2>
        </div>
      </div>
      {error ? <div className="alert alert-danger mb-0" role="alert">{"No Internet.Please connect to WIFI or Internet."}</div> : (
        <div className="row g-3">
          {posts.slice(0, compact ? 2 : 6).map((post) => (
            <div className={compact ? 'col-12' : 'col-12 col-md-6 col-xl-4'} key={post._id}>
              <article className="card site-post-card h-100">
                {post.imageUrl && (
                  <img
                    className="site-post-image"
                    src={postService.getImageUrl(post._id)}
                    alt=""
                    loading="lazy"
                  />
                )}
                <div className="card-body">
                  <time className="site-post-date" dateTime={post.publishedAt || post.createdAt}>
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString(language === 'am' ? 'am-ET' : undefined)}
                  </time>
                  <h3 className="h5 mt-2">{post.title}</h3>
                  <p className="site-post-content mb-0">{post.content}</p>
                </div>
              </article>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default PostFeed
