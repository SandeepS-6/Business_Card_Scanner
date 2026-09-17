import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setTheme } from '@/store/themeSlice'
import type { ThemeMode } from '@/types'

export function ThemeSwitcher({ id }: { id?: string }) {
  const theme = useAppSelector((s) => s.theme.theme)
  const dispatch = useAppDispatch()

  return (
    <Select
      value={theme}
      onValueChange={(v) => dispatch(setTheme(v as ThemeMode))}
    >
      <SelectTrigger id={id} aria-label="Color theme">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectContent>
    </Select>
  )
}
