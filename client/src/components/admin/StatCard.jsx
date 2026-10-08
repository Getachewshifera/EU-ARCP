// Purpose: Summary metric card for the administration dashboard.
function StatCard({ label, value, hint, accent = 'primary' }) {
  return (
    <article className={`card h-100 border-start border-4 border-${accent}`}>
      <div className="card-body">
        <p className="text-secondary small fw-semibold text-uppercase mb-2">{label}</p>
        <p className="display-6 fw-bold mb-1">{value ?? '—'}</p>
        {hint && <p className="small text-secondary mb-0">{hint}</p>}
      </div>
    </article>
  )
}

export default StatCard
