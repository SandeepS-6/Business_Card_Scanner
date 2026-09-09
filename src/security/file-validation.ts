const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const MAX_BYTES = 8 * 1024 * 1024
const MAX_FILES = 20
const MAX_NAME = 180

export type FileValidationError =
  | 'unsupported_type'
  | 'too_large'
  | 'too_many'
  | 'bad_name'
  | 'empty'

export type ValidatedFiles = {
  accepted: File[]
  rejected: { name: string; reason: FileValidationError }[]
}

function extOf(name: string) {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

/** SECURITY: Frontend checks are UX only — backend must re-validate MIME/size/content. */
export function validateImageFiles(files: FileList | File[], opts?: { maxFiles?: number; maxBytes?: number }): ValidatedFiles {
  const list = Array.from(files)
  const maxFiles = opts?.maxFiles ?? MAX_FILES
  const maxBytes = opts?.maxBytes ?? MAX_BYTES
  const accepted: File[] = []
  const rejected: ValidatedFiles['rejected'] = []

  if (list.length > maxFiles) {
    return {
      accepted: [],
      rejected: list.map((f) => ({ name: f.name, reason: 'too_many' as const })),
    }
  }

  for (const file of list) {
    if (!file.size) {
      rejected.push({ name: file.name, reason: 'empty' })
      continue
    }
    if (file.name.length > MAX_NAME) {
      rejected.push({ name: file.name, reason: 'bad_name' })
      continue
    }
    if (file.size > maxBytes) {
      rejected.push({ name: file.name, reason: 'too_large' })
      continue
    }
    const mimeOk = ALLOWED_MIME.has(file.type)
    const extOk = ALLOWED_EXT.has(extOf(file.name))
    if (!mimeOk || !extOk) {
      rejected.push({ name: file.name, reason: 'unsupported_type' })
      continue
    }
    accepted.push(file)
  }

  return { accepted, rejected }
}

export function fileValidationMessage(reason: FileValidationError) {
  switch (reason) {
    case 'unsupported_type':
      return 'Only JPEG, PNG, or WEBP images are allowed'
    case 'too_large':
      return 'File exceeds the 8 MB limit'
    case 'too_many':
      return `Too many files (max ${MAX_FILES})`
    case 'bad_name':
      return 'File name is too long'
    case 'empty':
      return 'File is empty'
  }
}
