import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initMonitoring, MonitoringBoundary } from './monitoring'

initMonitoring()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MonitoringBoundary>
      <App />
    </MonitoringBoundary>
  </StrictMode>,
)
