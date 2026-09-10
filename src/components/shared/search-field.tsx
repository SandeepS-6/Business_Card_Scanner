import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
  id,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
  id?: string
}) {
  return (
    <div className={cn('relative min-w-[12rem] flex-1 sm:max-w-xs', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        id={id}
        className="h-9 pl-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  )
}
