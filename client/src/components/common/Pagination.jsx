// Purpose: Controls for moving between result pages.
function Pagination({ page, totalPages, onPageChange, className = '' }) {
  const currentPage = Math.max(1, Number(page) || 1)
  const lastPage = Math.max(1, Number(totalPages) || 1)
  if (lastPage <= 1) return null

  const pageCount = Math.min(5, lastPage)
  const start = Math.max(1, Math.min(currentPage - 2, lastPage - pageCount + 1))
  const pages = Array.from({ length: pageCount }, (_, index) => start + index)

  return (
    <nav aria-label="Pagination" className={className}>
      <ul className="pagination justify-content-center mb-0">
        <li className={`page-item${currentPage <= 1 ? ' disabled' : ''}`}>
          <button aria-label="Previous page" className="page-link" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)} type="button">Previous</button>
        </li>
        {pages.map((item) => (
          <li className={`page-item${item === currentPage ? ' active' : ''}`} key={item}>
            <button aria-current={item === currentPage ? 'page' : undefined} className="page-link" onClick={() => onPageChange(item)} type="button">{item}</button>
          </li>
        ))}
        <li className={`page-item${currentPage >= lastPage ? ' disabled' : ''}`}>
          <button aria-label="Next page" className="page-link" disabled={currentPage >= lastPage} onClick={() => onPageChange(currentPage + 1)} type="button">Next</button>
        </li>
      </ul>
    </nav>
  )
}

export default Pagination
