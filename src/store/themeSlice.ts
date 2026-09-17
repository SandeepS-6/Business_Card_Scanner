import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ThemeMode } from '@/types'

export const THEME_STORAGE_KEY = 'bcs-theme'
const SESSION_KEY = 'bcs-demo-session'

function parseTheme(value: unknown): ThemeMode | null {
  return value === 'light' || value === 'dark' ? value : null
}

/** Hydrate from bcs-theme, else migrate session.themeMode (legacy system → light). */
export function readStoredTheme(): ThemeMode {
  try {
    const fromKey = parseTheme(localStorage.getItem(THEME_STORAGE_KEY))
    if (fromKey) return fromKey

    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return 'light'
    const parsed = JSON.parse(raw) as { themeMode?: unknown }
    const migrated = parseTheme(parsed.themeMode)
    if (migrated) {
      localStorage.setItem(THEME_STORAGE_KEY, migrated)
      return migrated
    }
  } catch {
    /* ignore corrupt storage */
  }
  return 'light'
}

export function applyThemeClass(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function persistTheme(theme: ThemeMode) {
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

type ThemeState = {
  theme: ThemeMode
}

const initialState: ThemeState = {
  theme: typeof document !== 'undefined' ? readStoredTheme() : 'light',
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
    },
  },
})

export const { setTheme, toggleTheme } = themeSlice.actions
export default themeSlice.reducer
