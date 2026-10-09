// Purpose: Validates material request data.
function toStringValue(value) {
  return typeof value === 'string' ? value : '';
}

function validateMaterialInput(payload) {
  const title = toStringValue(payload?.title).trim();
  const subject = toStringValue(payload?.subject).trim();
  const course = toStringValue(payload?.course).trim();
  const description = toStringValue(payload?.description);
  const category = toStringValue(payload?.category);

  if (!title) {
    return { error: 'A material title is required.' };
  }
  if (title.length > 200) {
    return { error: 'Material title must be at most 200 characters.' };
  }
  if (subject.length > 200) {
    return { error: 'Material subject must be at most 200 characters.' };
  }
  if (course.length > 200) {
    return { error: 'Material course must be at most 200 characters.' };
  }
  if (description.length > 4000) {
    return { error: 'Material description must be at most 4000 characters.' };
  }
  if (category && category.length > 200) {
    return { error: 'Material category must be at most 200 characters.' };
  }

  return {
    value: {
      title,
      subject,
      course,
      description: description.trim(),
      category: category || undefined,
    },
  };
}

function validateMaterialUpdate(payload) {
  const validation = validateMaterialInput(payload);
  if (validation.error) return validation;
  return { value: validation.value };
}

module.exports = { validateMaterialInput, validateMaterialUpdate };
