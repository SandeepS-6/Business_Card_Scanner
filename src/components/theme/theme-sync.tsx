import { useLayoutEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { applyThemeClass, persistTheme } from '@/store/themeSlice'

/** Keeps html.dark + bcs-theme in sync with Redux theme state. */
export function ThemeSync() {
  const theme = useAppSelector((s) => s.theme.theme)

  useLayoutEffect(() => {
    applyThemeClass(theme)
    persistTheme(theme)
  }, [theme])

  return null
}
