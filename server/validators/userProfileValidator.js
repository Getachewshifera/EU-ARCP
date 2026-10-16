// Purpose: Normalizes editable profile fields while protecting account identifiers.
const fieldAliases = {
  universityId: 'university',
  collegeId: 'college',
  departmentId: 'department',
  programId: 'program',
  profilePicture: 'profilePhoto',
};

const editableFields = new Set([
  'firstName',
  'middleName',
  'lastName',
  'bio',
  'profilePhoto',
  'university',
  'college',
  'department',
  'program',
  'academicYear',
  'phone',
  'email',
]);

const readOnlyFields = new Set([
  '_id',
  '__v',
  'id',
  'username',
  'studentId',
  'identityId',
  'name',
  'role',
  'status',
  'isActive',
  'approvalStatus',
  'emailVerified',
  'mustChangePassword',
  'activationExpiresAt',
  'passwordChangedAt',
  'createdAt',
  'updatedAt',
  'otpAttempts',
  'otpLockedUntil',
]);

function normalizeUserProfileUpdate(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'Provide profile fields to update.' };
  }

  const normalized = {};
  for (const [field, value] of Object.entries(payload)) {
    if (readOnlyFields.has(field)) continue;

    const canonicalField = fieldAliases[field] || field;
    if (!editableFields.has(canonicalField)) {
      return { error: 'Only profile fields can be updated.' };
    }
    if (Object.hasOwn(normalized, canonicalField)) {
      return { error: `Provide ${canonicalField} only once.` };
    }
    const normalizedValue = ['university', 'college', 'department', 'program'].includes(canonicalField)
      && value && typeof value === 'object'
      ? value._id ?? value.id
      : value;
    normalized[canonicalField] = normalizedValue;
  }

  if (Object.keys(normalized).length === 0) {
    return { error: 'Provide profile fields to update.' };
  }

  return { value: normalized };
}

module.exports = { normalizeUserProfileUpdate };
