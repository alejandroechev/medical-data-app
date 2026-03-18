import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerPeriodicSync } from './infra/periodic-sync-registration'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register periodic background sync for pickup notifications (Chrome Android)
registerPeriodicSync()
