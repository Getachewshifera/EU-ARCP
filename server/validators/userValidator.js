// Purpose: Validates user and profile request data.
const ALLOWED_ROLES = new Set(['student', 'lecturer', 'admin']);
const ALLOWED_STATUSES = new Set(['active', 'suspended']);

function validateUserUpdate(updates) {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return { error: 'Request body must be an object.' };
  }

  const keys = Object.keys(updates);
  if (keys.length === 0 || keys.some((key) => !['role', 'status'].includes(key))) {
    return { error: 'Only role and status can be updated.' };
  }
  if (updates.role !== undefined && !ALLOWED_ROLES.has(updates.role)) {
    return { error: 'Role must be student, lecturer, or admin.' };
  }
  if (updates.status !== undefined && !ALLOWED_STATUSES.has(updates.status)) {
    return { error: 'Status must be active or suspended.' };
  }

  return { value: updates };
}

module.exports = { validateUserUpdate };
