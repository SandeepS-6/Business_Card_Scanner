import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useApp } from '@/context/app-context'
import { versionService } from '@/services/features-api'
import { formatDateTime } from '@/lib/utils'
import type { ContentVersion } from '@/types/features'
import { toast } from 'sonner'

export function VersionsPage() {
  const { organization } = useApp()
  const { data = [], isLoading } = useQuery({
    queryKey: ['content-versions', organization?.id],
    queryFn: () => versionService.list(),
    enabled: !!organization,
  })
  const [selected, setSelected] = useState<ContentVersion | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<ContentVersion | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, ContentVersion[]>()
    for (const v of data) {
      const key = `${v.resourceType}:${v.resourceId}`
      map.set(key, [...(map.get(key) ?? []), v])
    }
    return [...map.entries()]
  }, [data])

  return (
    <div>
      <PageHeader
        title="Version History"
        description="CMS pages, templates, branding, and configuration snapshots. Restoring keeps the current version in history."
      />
      {isLoading ? <p className="text-sm text-muted-foreground">Loading versions…</p> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {grouped.map(([key, versions]) => (
            <Card key={key} className="p-4">
              <p className="mb-3 text-sm font-semibold capitalize">{versions[0]?.resourceName}</p>
              <ul className="space-y-2">
                {versions
                  .slice()
                  .sort((a, b) => b.version - a.version)
                  .map((v) => (
                    <li key={v.id}>
                      <button
                        type="button"
                        className="w-full rounded-md border border-border px-3 py-2 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => setSelected(v)}
                      >
                        <p className="font-medium">Version {v.version}</p>
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDateTime(v.createdAt)} by {v.createdBy}
                        </p>
                        <p className="text-sm">{v.summary}</p>
                      </button>
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
        </div>
        <Card className="p-5">
          {selected ? (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold">
                {selected.resourceName} · v{selected.version}
              </h2>
              <p className="text-sm text-muted-foreground">
                Created {formatDateTime(selected.createdAt)} by {selected.createdBy}
              </p>
              <p className="text-sm">
                <span className="font-medium">Change summary: </span>
                {selected.summary}
              </p>
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                <p className="mb-1 font-medium">Snapshot preview</p>
                <p className="text-muted-foreground">{selected.snapshot}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-border p-3 text-sm">
                  <p className="font-medium">Before (prior)</p>
                  <p className="text-muted-foreground">Previous published content</p>
                </div>
                <div className="rounded-md border border-border p-3 text-sm">
                  <p className="font-medium">After (this version)</p>
                  <p className="text-muted-foreground">{selected.snapshot}</p>
                </div>
              </div>
              <Button onClick={() => setRestoreTarget(selected)}>Restore version</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a version to compare and restore.</p>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(v) => !v && setRestoreTarget(null)}
        title={restoreTarget ? `Restore Version ${restoreTarget.version}?` : 'Restore'}
        description="Your current version will be preserved in history. This is a mock restore."
        confirmLabel="Restore Version"
        onConfirm={() => {
          toast.success(`Restored version ${restoreTarget?.version} (mock)`)
          setRestoreTarget(null)
        }}
      />
    </div>
  )
}
