export const PASSWORD_HINT = 'At least 8 characters, including uppercase and lowercase letters, a number, and a special character.'
export const PASSWORD_PATTERN = '(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9\\s]).{8,200}'

export function getPasswordPolicyError(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters.'
  if (password.length > 200) return 'Password must be 200 characters or fewer.'
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.'
  if (!/\d/.test(password)) return 'Password must include at least one number.'
  if (!/[^A-Za-z0-9\s]/.test(password)) return 'Password must include at least one special character.'
  return ''
}
