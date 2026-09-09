import { useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fileValidationMessage, validateImageFiles } from '@/security/file-validation'
import { toast } from 'sonner'

/** Shared upload control — image uploads always go through validateImageFiles. */
export function FileUploadArea({
  onFiles,
  multiple,
  accept = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
  label = 'Drag & drop JPEG/PNG/WEBP images, or click to browse',
  className,
  /** When false, skip image validation (rare; prefer SecureFileUpload for images). */
  validateImages = true,
}: {
  onFiles: (files: FileList | File[]) => void
  multiple?: boolean
  accept?: string
  label?: string
  className?: string
  validateImages?: boolean
}) {
  const [dragOver, setDragOver] = useState(false)

  const handle = (list: FileList | null) => {
    if (!list?.length) return
    if (validateImages) {
      const { accepted, rejected } = validateImageFiles(list)
      rejected.forEach((r) => toast.error(`${r.name}: ${fileValidationMessage(r.reason)}`))
      if (accepted.length) onFiles(accepted)
      return
    }
    onFiles(list)
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handle(e.dataTransfer.files)
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center transition hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring',
        dragOver && 'border-primary bg-accent/40',
        className,
      )}
    >
      <Upload className="size-8 text-muted-foreground" aria-hidden />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">Client validation only — backend must revalidate uploads.</span>
      <input
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          handle(e.target.files)
          e.target.value = ''
        }}
      />
    </label>
  )
}
