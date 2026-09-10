import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { SearchField } from '@/components/shared/search-field'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApp } from '@/context/app-context'
import { can } from '@/security/permissions'
import { automationService } from '@/services/features-api'
import { formatDateTime } from '@/lib/utils'
import type { AutomationRule, AutomationStatus } from '@/types/features'
import { toast } from 'sonner'

const TRIGGERS = [
  'Contact created',
  'Lead created',
  'Event created',
  'Contact updated',
  'Lead status changed',
  'Follow-up created',
  'Follow-up overdue',
  'Card scanned',
  'Contact imported',
]

const ACTIONS = [
  'Add tag',
  'Assign owner',
  'Assign event',
  'Create follow-up',
  'Change lead status',
  'Send notification',
  'Send email',
  'Send WhatsApp message',
  'Create task',
]

function statusVariant(s: AutomationStatus) {
  if (s === 'active') return 'success' as const
  if (s === 'error') return 'danger' as const
  if (s === 'paused') return 'warning' as const
  return 'muted' as const
}

export function AutomationsPage() {
  const { organization, user } = useApp()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const canManage = can(user?.role, 'AUTOMATIONS_MANAGE')
  const [q, setQ] = useState('')

  const { data = [], isLoading } = useQuery({
    queryKey: ['automations', organization?.id],
    queryFn: () => automationService.list(organization!.id),
    enabled: !!organization,
  })

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return data
    return data.filter((a) => `${a.name} ${a.trigger} ${a.status} ${a.createdBy}`.toLowerCase().includes(query))
  }, [data, q])

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AutomationStatus }) =>
      automationService.setStatus(id, status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['automations'] }),
  })

  return (
    <div>
      <PageHeader
        title="Automations"
        description="Trigger → condition → action workflows. UI simulation only — no arbitrary code execution."
        actions={
          canManage ? (
            <Button onClick={() => navigate('/automations/new')}>Create automation</Button>
          ) : null
        }
      />
      <div className="mb-4">
        <SearchField value={q} onChange={setQ} placeholder="Search automations…" />
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {!isLoading && filtered.length === 0 ? (
        <EmptyState title="No automations" description={q ? 'No automations match your search.' : 'Create a rule to automate follow-ups and tags.'} />
      ) : (
        <DataTable columns={['Name', 'Status', 'Trigger', 'Last run', 'Runs', 'Success', 'Created by', 'Updated', 'Actions']}>
          {filtered.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3 font-medium">
                <Link className="hover:underline" to={`/automations/${a.id}`}>
                  {a.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusVariant(a.status)}>{a.status.toUpperCase()}</Badge>
              </td>
              <td className="px-4 py-3">{a.trigger}</td>
              <td className="px-4 py-3 whitespace-nowrap">{a.lastRunAt ? formatDateTime(a.lastRunAt) : '—'}</td>
              <td className="px-4 py-3">{a.runs}</td>
              <td className="px-4 py-3">{a.successRate}%</td>
              <td className="px-4 py-3">{a.createdBy}</td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(a.updatedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/automations/${a.id}`)}>
                    Edit
                  </Button>
                  {canManage && a.status === 'active' ? (
                    <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: a.id, status: 'paused' })}>
                      Pause
                    </Button>
                  ) : null}
                  {canManage && a.status !== 'active' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setStatus.mutate({ id: a.id, status: 'active' })
                        toast.success('Activated')
                      }}
                    >
                      Activate
                    </Button>
                  ) : null}
                  {canManage ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const copy: AutomationRule = {
                          ...a,
                          id: `auto-${Date.now()}`,
                          name: `${a.name} (copy)`,
                          status: 'draft',
                          runs: 0,
                          successRate: 0,
                          updatedAt: new Date().toISOString(),
                        }
                        void automationService.save(copy).then(() => {
                          toast.success('Duplicated')
                          void qc.invalidateQueries({ queryKey: ['automations'] })
                        })
                      }}
                    >
                      Duplicate
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}

export function AutomationBuilderPage() {
  const { id } = useParams()
  const isNew = id === 'new' || !id
  const { organization, user } = useApp()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const canManage = can(user?.role, 'AUTOMATIONS_MANAGE')

  const { data: existing } = useQuery({
    queryKey: ['automation', organization?.id, id],
    queryFn: () => automationService.get(id!, organization?.id),
    enabled: !isNew && !!id && !!organization,
  })

  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState(TRIGGERS[0])
  const [logic, setLogic] = useState<'and' | 'or'>('and')
  const [conditions, setConditions] = useState([{ field: 'Event', op: 'equals', value: 'Tech Expo 2026' }])
  const [actions, setActions] = useState([{ type: 'Add tag', config: 'Tech Expo' }])
  const [step, setStep] = useState(1)
  const [testOpen, setTestOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!existing) return
    setName(existing.name)
    setTrigger(existing.trigger)
    setLogic(existing.conditionLogic)
    setConditions(existing.conditions)
    setActions(existing.actions)
  }, [existing])

  const { data: runs = [] } = useQuery({
    queryKey: ['automation-runs', existing?.id],
    queryFn: () => automationService.runs(existing!.id),
    enabled: !!existing?.id,
  })

  const save = useMutation({
    mutationFn: async (status: AutomationStatus) => {
      const rule: AutomationRule = {
        id: existing?.id ?? `auto-${Date.now()}`,
        orgId: organization!.id,
        name: name || 'Untitled automation',
        status,
        trigger,
        conditions,
        conditionLogic: logic,
        actions,
        runs: existing?.runs ?? 0,
        successRate: existing?.successRate ?? 0,
        createdBy: existing?.createdBy ?? user?.firstName ?? 'You',
        updatedAt: new Date().toISOString(),
        lastRunAt: existing?.lastRunAt,
      }
      return automationService.save(rule)
    },
    onSuccess: (rule) => {
      toast.success(rule.status === 'draft' ? 'Draft saved' : 'Automation saved')
      void qc.invalidateQueries({ queryKey: ['automations'] })
      navigate(`/automations/${rule.id}`)
    },
  })

  const flow = useMemo(
    () => [
      { kind: 'trigger' as const, label: trigger },
      ...conditions.map((c, i) => ({
        kind: 'condition' as const,
        label: `${i === 0 ? 'IF' : logic.toUpperCase()} ${c.field} ${c.op} ${c.value}`,
      })),
      ...actions.map((a) => ({ kind: 'action' as const, label: `${a.type}: ${a.config}` })),
    ],
    [trigger, conditions, actions, logic],
  )

  if (!canManage && isNew) {
    return <EmptyState title="Permission denied" description="Only admins can create automations." />
  }

  return (
    <div>
      <PageHeader
        title={isNew ? 'Create automation' : name || 'Edit automation'}
        description="Visual builder · mock execution only"
        backTo="/automations"
        backLabel="Back to automations"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setTestOpen(true)}>
              Test
            </Button>
            <Button variant="secondary" disabled={save.isPending} onClick={() => save.mutate('draft')}>
              Save draft
            </Button>
            <Button disabled={save.isPending} onClick={() => save.mutate('active')}>
              Activate
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[1, 2, 3].map((s) => (
          <Button key={s} size="sm" variant={step === s ? 'default' : 'outline'} onClick={() => setStep(s)}>
            Step {s}: {s === 1 ? 'Trigger' : s === 2 ? 'Conditions' : 'Actions'}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="space-y-4 p-5">
          <div>
            <Label htmlFor="auto-name">Name</Label>
            <Input id="auto-name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {step === 1 ? (
            <div>
              <Label>Trigger</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Logic</Label>
                <Button size="sm" variant={logic === 'and' ? 'default' : 'outline'} onClick={() => setLogic('and')}>
                  AND
                </Button>
                <Button size="sm" variant={logic === 'or' ? 'default' : 'outline'} onClick={() => setLogic('or')}>
                  OR
                </Button>
              </div>
              {conditions.map((c, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-4">
                  <Input
                    aria-label="Field"
                    value={c.field}
                    onChange={(e) =>
                      setConditions((prev) => prev.map((x, j) => (j === i ? { ...x, field: e.target.value } : x)))
                    }
                  />
                  <Input
                    aria-label="Operator"
                    value={c.op}
                    onChange={(e) =>
                      setConditions((prev) => prev.map((x, j) => (j === i ? { ...x, op: e.target.value } : x)))
                    }
                  />
                  <Input
                    aria-label="Value"
                    value={c.value}
                    onChange={(e) =>
                      setConditions((prev) => prev.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                    }
                  />
                  <Button
                    variant="ghost"
                    onClick={() => setConditions((prev) => prev.filter((_, j) => j !== i))}
                    disabled={conditions.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setConditions((prev) => [...prev, { field: 'Company type', op: 'equals', value: 'Enterprise' }])}
              >
                Add condition
              </Button>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              {actions.map((a, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Select
                    value={a.type}
                    onValueChange={(v) => setActions((prev) => prev.map((x, j) => (j === i ? { ...x, type: v } : x)))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    aria-label="Action config"
                    value={a.config}
                    onChange={(e) =>
                      setActions((prev) => prev.map((x, j) => (j === i ? { ...x, config: e.target.value } : x)))
                    }
                  />
                  <Button variant="ghost" onClick={() => setActions((prev) => prev.filter((_, j) => j !== i))} disabled={actions.length === 1}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={() => setActions((prev) => [...prev, { type: 'Create follow-up', config: 'Email in 1 day' }])}>
                Add action
              </Button>
            </div>
          ) : null}
        </Card>

        <Card className="p-4" aria-label="Automation flow preview">
          <p className="mb-3 text-sm font-semibold">Flow</p>
          <ol className="space-y-2">
            {flow.map((node, i) => (
              <li key={i} className="text-sm">
                <div
                  className={
                    node.kind === 'trigger'
                      ? 'rounded-md bg-primary/10 px-2 py-2'
                      : node.kind === 'condition'
                        ? 'rounded-md bg-amber-500/10 px-2 py-2'
                        : 'rounded-md bg-emerald-500/10 px-2 py-2'
                  }
                >
                  <span className="text-[10px] uppercase text-muted-foreground">{node.kind}</span>
                  <p>{node.label}</p>
                </div>
                {i < flow.length - 1 ? <p className="py-1 text-center text-muted-foreground">↓</p> : null}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {runs.length ? (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">Run history</h2>
          <DataTable columns={['When', 'Trigger', 'Contact', 'Result', 'Duration', 'Actions', 'Error']}>
            {runs.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(r.ranAt)}</td>
                <td className="px-4 py-3">{r.trigger}</td>
                <td className="px-4 py-3">{r.contactName}</td>
                <td className="px-4 py-3">
                  <Badge variant={r.result === 'success' ? 'success' : r.result === 'failed' ? 'danger' : 'muted'}>
                    {r.result.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3">{r.durationMs}ms</td>
                <td className="px-4 py-3">{r.actionsExecuted.join(', ') || '—'}</td>
                <td className="px-4 py-3 text-destructive">{r.error ?? '—'}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      ) : null}

      {!isNew && canManage ? (
        <div className="mt-6">
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete automation
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={testOpen}
        onOpenChange={setTestOpen}
        title="Test automation"
        description={`Mock input: Contact John Smith · Event Tech Expo · Company Enterprise. Trigger matched ✓ · Conditions matched ✓ · Actions preview: ${actions.map((a) => a.type).join(', ')}.`}
        confirmLabel="Run test"
        onConfirm={() => {
          toast.success('Test completed (mock)')
          setTestOpen(false)
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete automation?"
        description="This cannot be undone in the mock store."
        destructive
        confirmLabel="Delete"
        onConfirm={async () => {
          if (existing) await automationService.setStatus(existing.id, 'draft')
          toast.success('Marked inactive (mock delete)')
          setDeleteOpen(false)
          navigate('/automations')
        }}
      />
    </div>
  )
}
