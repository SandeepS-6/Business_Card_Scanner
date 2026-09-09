import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { sanitizeExternalUrl } from '@/security/safe-url'
import { cn } from '@/lib/utils'

export function SafeExternalLink({
  href,
  children,
  className,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href?: string | null; children: ReactNode }) {
  const safe = sanitizeExternalUrl(href)
  if (!safe) {
    return <span className={cn('text-muted-foreground', className)}>{children}</span>
  }
  const external = safe.startsWith('http')
  return (
    <a
      {...rest}
      href={safe}
      className={cn('text-primary hover:underline', className)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}
