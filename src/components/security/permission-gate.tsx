import type { ReactNode } from 'react'
import { useApp } from '@/context/app-context'
import { can, type Permission } from '@/security/permissions'
import { PermissionDenied } from '@/components/shared/empty-state'

export function PermissionGate({
  permission,
  children,
  fallback = 'hide',
  message,
}: {
  permission: Permission
  children: ReactNode
  fallback?: 'hide' | 'disable' | 'deny'
  message?: string
}) {
  const { user } = useApp()
  const allowed = can(user?.role, permission)

  if (allowed) return <>{children}</>
  if (fallback === 'hide') return null
  if (fallback === 'deny') {
    return <PermissionDenied message={message ?? 'You do not have permission for this action.'} />
  }
  return (
    <div className="pointer-events-none opacity-50" aria-disabled>
      {children}
    </div>
  )
}

export function PermissionAwareButton({
  permission,
  children,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { permission: Permission }) {
  const { user } = useApp()
  const allowed = can(user?.role, permission)
  return (
    <button type="button" {...rest} disabled={disabled || !allowed} title={!allowed ? 'Permission required' : rest.title}>
      {children}
    </button>
  )
}
