// Purpose: Validates authentication request data.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validateLogin(payload) {
  const email = normalizeEmail(payload?.email);
  const password = typeof payload?.password === 'string' ? payload.password : '';

  if (!EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' };
  }
  if (password.length < 8 || password.length > 200) {
    return { error: 'Password must be at least 8 characters.' };
  }

  return { value: { email, password } };
}

function validateOtpRequest(payload) {
  const email = normalizeEmail(payload?.email);
  const otp = typeof payload?.otp === 'string' ? payload.otp.trim() : '';
  const purpose = payload?.purpose;

  if (!EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' };
  }
  if (!/^\d{6}$/.test(otp)) {
    return { error: 'A six-digit verification code is required.' };
  }
  if (!['registration', 'password-reset'].includes(purpose)) {
    return { error: 'Request purpose must be registration or password-reset.' };
  }

  return { value: { email, otp, purpose } };
}

function validateForgotPassword(payload) {
  const email = normalizeEmail(payload?.email);
  if (!EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' };
  }
  return { value: { email } };
}

function validatePasswordReset(payload) {
  const email = normalizeEmail(payload?.email);
  const password = typeof payload?.password === 'string' ? payload.password : '';
  const resetToken = typeof payload?.resetToken === 'string' ? payload.resetToken.trim() : '';

  if (!EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' };
  }
  if (!resetToken) {
    return { error: 'A valid reset token is required.' };
  }
  if (password.length < 8 || password.length > 200) {
    return { error: 'Password must be at least 8 characters.' };
  }

  return { value: { email, password, resetToken } };
}

module.exports = {
  normalizeEmail,
  validateLogin,
  validateOtpRequest,
  validateForgotPassword,
  validatePasswordReset,
};
