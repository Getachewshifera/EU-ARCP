const POST_FIELDS = ['title', 'content', 'status'];

function validatePostInput(input, { creating = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Post data must be an object.' };
  }

  const fields = Object.keys(input);
  if (!fields.length || fields.some((field) => !POST_FIELDS.includes(field))) {
    return { error: 'Post data contains missing or unsupported fields.' };
  }

  const value = {};
  if (Object.hasOwn(input, 'title')) {
    if (typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 160) {
      return { error: 'Post title is required and must be 160 characters or fewer.' };
    }
    value.title = input.title.trim();
  } else if (creating) {
    return { error: 'Post title is required.' };
  }

  if (Object.hasOwn(input, 'content')) {
    if (typeof input.content !== 'string' || !input.content.trim() || input.content.trim().length > 10000) {
      return { error: 'Post content is required and must be 10,000 characters or fewer.' };
    }
    value.content = input.content.trim();
  } else if (creating) {
    return { error: 'Post content is required.' };
  }

  if (Object.hasOwn(input, 'status')) {
    if (!['draft', 'published'].includes(input.status)) {
      return { error: 'Post status must be draft or published.' };
    }
    value.status = input.status;
  }

  return { value };
}

module.exports = { validatePostInput };
