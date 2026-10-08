// Purpose: Reusable button with consistent application styling and states.
function Button({
  children,
  variant = 'primary',
  size,
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const classes = ['btn', `btn-${variant}`, size ? `btn-${size}` : '', className].filter(Boolean).join(' ')

  return (
    <button className={classes} disabled={disabled || loading} type={type} {...props}>
      {loading && <span aria-hidden="true" className="spinner-border spinner-border-sm me-2" />}
      {children}
    </button>
  )
}

export default Button
