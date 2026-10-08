// Purpose: Reusable, labeled form input.
function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  className = '',
  ...props
}) {
  const inputId = id || props.name

  return (
    <div className={className}>
      {label && <label className="form-label" htmlFor={inputId}>{label}</label>}
      <input
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        aria-invalid={Boolean(error)}
        className={`form-control${error ? ' is-invalid' : ''}`}
        id={inputId}
        onChange={onChange}
        type={type}
        value={value}
        {...props}
      />
      {error && <div className="invalid-feedback" id={`${inputId}-error`}>{error}</div>}
      {!error && hint && <div className="form-text" id={`${inputId}-hint`}>{hint}</div>}
    </div>
  )
}

export default Input
