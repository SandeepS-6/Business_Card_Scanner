import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { secureStorage } from '@/security/storage'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function InstallAppPrompt() {
  const [open, setOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null)

  useEffect(() => {
    if (secureStorage.installDismissed.get()) return

    const timer = window.setTimeout(() => setOpen(true), 1200)
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as InstallPromptEvent)
      setOpen(true)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onPrompt)
    }
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/25 px-4 pt-8">
      <div className="w-full max-w-[450px] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
        <h2 className="font-display text-[1.65rem] font-semibold text-slate-900">Install app</h2>
        <div className="mt-5 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-50">
            <img src="/favicon.svg" alt="" className="size-8" />
          </div>
          <div>
            <p className="font-medium text-slate-900">BusinessCardScanner</p>
            <p className="text-sm text-slate-500">localhost</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            className="rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700"
            onClick={async () => {
              if (deferredPrompt) await deferredPrompt.prompt()
              setOpen(false)
            }}
          >
            Install
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-2 border-blue-600 px-6 text-blue-700 hover:bg-blue-50"
            onClick={() => {
              secureStorage.installDismissed.set()
              setOpen(false)
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
