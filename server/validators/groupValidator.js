// Purpose: Validates group request data.
function validateGroupInput(payload) {
  const raw = payload || {};
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const description = typeof raw.description === 'string' ? raw.description : '';
  const course = typeof raw.course === 'string' ? raw.course.trim() : '';
  const isPrivate = raw.isPrivate;

  const effectiveName = name || title;
  if (!effectiveName || effectiveName.length > 160) {
    return { error: 'Group name must be 1 to 160 characters.' };
  }
  if (typeof description !== 'string' || description.length > 2000) {
    return { error: 'Group description must be at most 2000 characters.' };
  }
  if (typeof course !== 'string' || course.length > 160) {
    return { error: 'Course must be at most 160 characters.' };
  }
  if (typeof isPrivate !== 'boolean') {
    return { error: 'isPrivate must be a boolean.' };
  }

  return {
    value: {
      name: effectiveName,
      description: description.trim(),
      course: course,
      isPrivate,
    },
  };
}

module.exports = { validateGroupInput };
