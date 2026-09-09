import { useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fileValidationMessage, validateImageFiles } from '@/security/file-validation'
import { toast } from 'sonner'

export function SecureFileUpload({
  onFiles,
  multiple,
  label = 'Drag & drop JPEG/PNG/WEBP images, or click to browse',
  className,
}: {
  onFiles: (files: File[]) => void
  multiple?: boolean
  label?: string
  className?: string
}) {
  const [dragOver, setDragOver] = useState(false)

  const handle = (list: FileList | null) => {
    if (!list?.length) return
    const { accepted, rejected } = validateImageFiles(list)
    rejected.forEach((r) => toast.error(`${r.name}: ${fileValidationMessage(r.reason)}`))
    if (accepted.length) onFiles(accepted)
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
      <span className="text-xs text-muted-foreground">Max 8 MB · JPEG, PNG, WEBP · up to 20 files</span>
      <input
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple={multiple}
        onChange={(e) => {
          handle(e.target.files)
          e.target.value = ''
        }}
      />
    </label>
  )
}
