// Purpose: Validates selected academic documents before uploading.
const allowedTypes = new Map([
  ['.pdf', new Set(['application/pdf'])],
  ['.doc', new Set(['application/msword', 'application/vnd.ms-word'])],
  ['.docx', new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document'])],
  ['.ppt', new Set(['application/vnd.ms-powerpoint', 'application/vnd.ms-powerpoint.presentation'])],
  ['.pptx', new Set(['application/vnd.openxmlformats-officedocument.presentationml.presentation'])],
])

export function validateDocumentFile(file) {
  if (!file) return 'Choose a file to upload.'
  if (file.size > 20 * 1024 * 1024) return 'Files must be 20 MB or smaller.'
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
  const acceptedTypes = allowedTypes.get(extension)
  if (!acceptedTypes) return 'Upload a PDF, DOC, DOCX, PPT, or PPTX file.'
  if (!acceptedTypes.has(file.type)) return 'The selected file type does not match its extension.'
  return ''
}

export const documentAccept = '.pdf,.doc,.docx,.ppt,.pptx'
