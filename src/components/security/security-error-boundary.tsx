import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class SecurityErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // SECURITY: Never render stack traces / internals to users.
    if (import.meta.env.DEV) {
      console.error('[SecurityErrorBoundary]', error.message, info.componentStack)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <h2 className="font-display text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">This section failed to load. You can retry or return home.</p>
        <div className="flex gap-2">
          <Button onClick={() => this.setState({ hasError: false })}>Retry</Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go home
          </Button>
        </div>
      </div>
    )
  }
}
