import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AppProvider } from '@/context/app-context'
import { ThemeSync } from '@/components/theme/theme-sync'
import { AppRouter } from '@/App'
import { queryClient } from '@/lib/query-client'
import { store } from '@/store'
import { applyThemeClass, readStoredTheme } from '@/store/themeSlice'
import './index.css'

// Apply before first paint to avoid theme flash
applyThemeClass(readStoredTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppProvider>
            <ThemeSync />
            <AppRouter />
            <Toaster richColors position="top-right" />
          </AppProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
