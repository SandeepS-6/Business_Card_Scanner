import { Link } from 'react-router-dom'
import { AnalyzingImage } from '@/components/ui/analyzing-image'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">404</p>
      <AnalyzingImage className="mt-4 size-16 text-foreground" />
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm font-normal text-slate-500 dark:text-slate-400">
        This route doesn&apos;t exist — or the card we were looking for never scanned in.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 font-sans text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Back to home
      </Link>
    </div>
  )
}
