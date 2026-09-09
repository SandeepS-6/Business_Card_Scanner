import { Navigate, useSearchParams } from 'react-router-dom'

/** Legacy /capture → combined Home capture section. */
export function CapturePage() {
  const [params] = useSearchParams()
  const mode = params.get('mode')
  const q = mode === 'upload' ? '?mode=upload&focus=capture' : '?focus=capture'
  return <Navigate to={`/${q}`} replace />
}
