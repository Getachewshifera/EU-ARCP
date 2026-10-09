// Purpose: Validates registration request data.
function validateReviewDecision(payload) {
  const rawStatus = payload?.status;
  const note = typeof payload?.note === 'string' ? payload.note : '';

  if (!['approved', 'rejected', 'pending'].includes(rawStatus)) {
    return { error: 'Status must be approved, rejected, or pending.' };
  }
  if (note.length > 1000) {
    return { error: 'Review note must be at most 1000 characters.' };
  }

  return {
    value: {
      status: rawStatus,
      note: note.trim(),
    },
  };
}

function validateRegistrationStatusQuery(payload) {
  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!email) {
    return { error: 'Email is required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Enter a valid email address.' };
  }
  return { value: { email } };
}

module.exports = { validateReviewDecision, validateRegistrationStatusQuery };
