const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function validateAppearance(input) {
  const allowedFields = ['primaryColor', 'backgroundColor'];
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || Object.keys(input).length !== allowedFields.length
    || Object.keys(input).some((field) => !allowedFields.includes(field))) {
    return { error: 'Provide only a primary color and background color.' };
  }

  for (const field of allowedFields) {
    if (typeof input[field] !== 'string' || !HEX_COLOR.test(input[field])) {
      return { error: `${field} must be a six-digit hexadecimal color.` };
    }
  }

  return {
    value: {
      primaryColor: input.primaryColor.toLowerCase(),
      backgroundColor: input.backgroundColor.toLowerCase(),
    },
  };
}

module.exports = { validateAppearance };
