// Purpose: Reusable password input with show/hide eye toggle icon.
import { useState } from 'react'

function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  required = false,
  autoComplete = 'current-password',
  disabled = false,
  placeholder,
  minLength,
  maxLength,
  className = '',
  inputClassName = '',
  error,
  hint,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = id || name

  return (
    <div className={className}>
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="position-relative password-input-wrapper">
        <input
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className={`form-control ${error ? 'is-invalid' : ''} ${inputClassName}`.trim()}
          disabled={disabled}
          id={inputId}
          maxLength={maxLength}
          minLength={minLength}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          type={showPassword ? 'text' : 'password'}
          value={value}
          {...props}
        />
        <button
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="password-toggle-btn"
          onClick={() => setShowPassword((current) => !current)}
          tabIndex="-1"
          title={showPassword ? 'Hide password' : 'Show password'}
          type="button"
        >
          {showPassword ? (
            /* Eye slash icon (hide) */
            <svg
              className="password-eye-icon"
              fill="none"
              height="18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="18"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            /* Eye icon (show) */
            <svg
              className="password-eye-icon"
              fill="none"
              height="18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="18"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <div className="invalid-feedback d-block">{error}</div>}
      {!error && hint && <div className="form-text">{hint}</div>}
    </div>
  )
}

export default PasswordInput
