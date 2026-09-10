import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { AppChart } from '@/components/charts/app-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useApp } from '@/context/app-context'
import { can } from '@/security/permissions'
import { billingService } from '@/services/features-api'
import type { PlanId } from '@/types/features'
import { toast } from 'sonner'

function UsageMeter({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / max) * 100))
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {used.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function BillingPage() {
  const { organization, user } = useApp()
  const qc = useQueryClient()
  const canManage = can(user?.role, 'BILLING_MANAGE')
  const canExport = can(user?.role, 'BILLING_VIEW')
  const [upgradeStep, setUpgradeStep] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [downgradeOpen, setDowngradeOpen] = useState(false)

  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: () => billingService.plans() })
  const { data: current } = useQuery({
    queryKey: ['org-plan', organization?.id],
    queryFn: () => billingService.current(organization!.id),
    enabled: !!organization,
  })
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', organization?.id],
    queryFn: () => billingService.invoices(organization!.id),
    enabled: !!organization,
  })
  const { data: txns = [] } = useQuery({
    queryKey: ['billing-txns', organization?.id],
    queryFn: () => billingService.transactions(organization!.id),
    enabled: !!organization,
  })

  const plan = useMemo(() => plans.find((p) => p.id === current?.planId), [plans, current])

  const setPlan = useMutation({
    mutationFn: (planId: PlanId) => billingService.setPlan(organization!.id, planId),
    onSuccess: () => {
      toast.success('Plan updated (mock)')
      setUpgradeStep(0)
      setSelectedPlan(null)
      void qc.invalidateQueries({ queryKey: ['org-plan'] })
    },
  })

  return (
    <div>
      <PageHeader
        title="Plans & Billing"
        description="Subscription, usage, and invoices. Payment fields are placeholders — never enter real card data."
      />

      <Card className="mb-6 p-5">
        <h2 className="font-display text-lg font-semibold">Enterprise billing</h2>
        <p className="mt-1 text-sm text-muted-foreground">UI for postpaid / usage-based contracts — not wired to payments.</p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <li>Billing model: Postpaid + usage overage</li>
          <li>Contract: NET-30 · MSA-2026-NEXUS</li>
          <li>Billing contact: finance@nexus-events.example</li>
          <li>Invoice terms: Electronic PDF · ACH preferred</li>
        </ul>
      </Card>

      {plan && current ? (
        <Card className="mb-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="font-display text-2xl font-semibold">{plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {plan.id === 'enterprise' ? 'Custom pricing' : `$${plan.priceMonthly}/month`} · Next billing{' '}
                {current.nextBilling}
              </p>
            </div>
            {canManage ? (
              <Button
                onClick={() => {
                  setUpgradeStep(1)
                  setSelectedPlan(null)
                }}
              >
                Change plan
              </Button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <UsageMeter label="Cards" used={current.usage.cards} max={plan.cardsMonth} />
            <UsageMeter label="Storage (GB)" used={current.usage.storage} max={plan.storageGb} />
            <UsageMeter label="Users" used={current.usage.users} max={plan.users} />
          </div>
        </Card>
      ) : null}

      {upgradeStep > 0 ? (
        <Card className="mb-6 space-y-4 p-5">
          <p className="font-semibold">
            {upgradeStep === 1
              ? 'Select plan'
              : upgradeStep === 2
                ? 'Compare features'
                : upgradeStep === 3
                  ? 'Review'
                  : upgradeStep === 4
                    ? 'Payment placeholder'
                    : 'Success'}
          </p>
          {upgradeStep === 1 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`rounded-lg border p-4 text-left ${selectedPlan === p.id ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                  onClick={() => setSelectedPlan(p.id)}
                >
                  <p className="font-display text-lg font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.id === 'enterprise' ? 'Contact sales' : `$${p.priceMonthly}/mo`}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>{p.users} users</li>
                    <li>{p.cardsMonth.toLocaleString()} cards/mo</li>
                    <li>{p.events} events</li>
                    <li>{p.support} support</li>
                  </ul>
                </button>
              ))}
            </div>
          ) : null}
          {upgradeStep === 2 && selectedPlan ? (
            <p className="text-sm text-muted-foreground">
              Comparing {plan?.name} → {plans.find((p) => p.id === selectedPlan)?.name}. Feature deltas are illustrative.
            </p>
          ) : null}
          {upgradeStep === 3 ? (
            <p className="text-sm">Effective immediately in this mock. No charge will be processed.</p>
          ) : null}
          {upgradeStep === 4 ? (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Payment form placeholder. Do not enter real payment credentials. Backend + PCI-compliant processor required later.
            </div>
          ) : null}
          {upgradeStep === 5 ? <p className="text-sm text-emerald-700 dark:text-emerald-400">Plan change applied in mock state.</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setUpgradeStep(0)}>
              Cancel
            </Button>
            {upgradeStep < 5 ? (
              <Button
                disabled={upgradeStep === 1 && !selectedPlan}
                onClick={() => {
                  if (upgradeStep === 4 && selectedPlan) {
                    void setPlan.mutateAsync(selectedPlan).then(() => setUpgradeStep(5))
                    return
                  }
                  if (
                    upgradeStep === 1 &&
                    selectedPlan &&
                    plan &&
                    plans.findIndex((p) => p.id === selectedPlan) < plans.findIndex((p) => p.id === plan.id)
                  ) {
                    setDowngradeOpen(true)
                    return
                  }
                  setUpgradeStep((s) => s + 1)
                }}
              >
                Continue
              </Button>
            ) : (
              <Button onClick={() => setUpgradeStep(0)}>Done</Button>
            )}
          </div>
        </Card>
      ) : null}

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => (
          <Card key={p.id} className="p-4">
            <p className="font-display text-lg font-semibold">{p.name}</p>
            <p className="text-sm text-muted-foreground">
              {p.id === 'enterprise' ? 'Custom' : `$${p.priceMonthly}/mo`}
            </p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li>{p.users} users · {p.cardsMonth.toLocaleString()} cards</li>
              <li>{p.storageGb} GB · OCR {p.ocr.toLocaleString()}</li>
              <li>Email {p.email.toLocaleString()} · WhatsApp {p.whatsapp.toLocaleString()}</li>
              <li>CRM: {p.crm ? 'Yes' : 'No'} · {p.support}</li>
            </ul>
          </Card>
        ))}
      </div>

      {current ? (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <AppChart
            id="billing-cards"
            title="Card usage"
            kind="line"
            categoryKey="m"
            series={[{ key: 'v', label: 'Cards' }]}
            rows={[
              { m: 'Jun', v: 4200 },
              { m: 'Jul', v: 6100 },
              { m: 'Aug', v: 7400 },
              { m: 'Sep', v: current.usage.cards },
            ]}
            canExport={canExport}
          />
          <AppChart
            id="billing-channels"
            title="Channel usage"
            kind="bar"
            categoryKey="channel"
            series={[{ key: 'used', label: 'Used' }]}
            rows={[
              { channel: 'OCR', used: current.usage.ocr },
              { channel: 'Email', used: current.usage.email },
              { channel: 'WhatsApp', used: current.usage.whatsapp },
              { channel: 'Storage', used: current.usage.storage },
            ]}
            canExport={canExport}
          />
        </div>
      ) : null}

      <h2 className="mb-3 font-display text-lg font-semibold">Invoices</h2>
      <DataTable columns={['Invoice', 'Date', 'Amount', 'Status', 'Actions']}>
        {invoices.map((inv) => (
          <tr key={inv.id}>
            <td className="px-4 py-3 font-medium">{inv.number}</td>
            <td className="px-4 py-3">{inv.date}</td>
            <td className="px-4 py-3">${inv.amount}</td>
            <td className="px-4 py-3">
              <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'failed' ? 'danger' : 'warning'}>
                {inv.status}
              </Badge>
            </td>
            <td className="px-4 py-3">
              <Button size="sm" variant="outline" onClick={() => toast.message(`View ${inv.number} (mock PDF)`)}>
                View
              </Button>{' '}
              <Button size="sm" variant="ghost" onClick={() => toast.success('Download started (mock)')}>
                Download
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>

      <h2 className="mb-3 mt-8 font-display text-lg font-semibold">Transactions</h2>
      <DataTable columns={['Date', 'Description', 'Amount', 'Status', 'Method']}>
        {txns.map((t) => (
          <tr key={t.id}>
            <td className="px-4 py-3">{t.date}</td>
            <td className="px-4 py-3">{t.description}</td>
            <td className="px-4 py-3">${t.amount}</td>
            <td className="px-4 py-3 capitalize">{t.status}</td>
            <td className="px-4 py-3">{t.method}</td>
          </tr>
        ))}
      </DataTable>

      <ConfirmDialog
        open={downgradeOpen}
        onOpenChange={setDowngradeOpen}
        title="Downgrade plan?"
        description={`You will lose higher quotas from ${plan?.name}. Change is effective next billing date in a real system; mock applies immediately after payment step.`}
        confirmLabel="Continue downgrade"
        destructive
        onConfirm={() => {
          setDowngradeOpen(false)
          setUpgradeStep(2)
        }}
      />
    </div>
  )
}
