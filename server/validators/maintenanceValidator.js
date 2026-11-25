// Purpose: Validates the maintenance mode setting and user-facing message.
function validateMaintenance(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || Object.keys(input).length !== 2
    || Object.keys(input).some((field) => !['enabled', 'message'].includes(field))) {
    return { error: 'Provide only the maintenance status and message.' };
  }
  if (typeof input.enabled !== 'boolean') {
    return { error: 'Maintenance status must be a boolean (enabled or disabled).' };
  }
  if (typeof input.message !== 'string' || !input.message.trim() || input.message.trim().length > 500) {
    return { error: 'Maintenance message is required and must be 500 characters or fewer.' };
  }
  return { value: { enabled: input.enabled, message: input.message.trim() } };
}

module.exports = { validateMaintenance };
