import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app'

let isAppMounted = false

function renderApp() {
  if (isAppMounted) return
  isAppMounted = true
  const rootElement = document.getElementById('root')
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  }
}

async function enableMocking() {
  try {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    })
    console.log('[MSW] Mocking enabled & worker active')
  } catch (error) {
    console.error('[MSW] Failed to start worker:', error)
  }
}

// Fallback timer ensures React mounts within 3 seconds if ServiceWorker activation stalls
const fallbackTimer = setTimeout(() => {
  renderApp()
}, 3000)

enableMocking().finally(() => {
  clearTimeout(fallbackTimer)
  renderApp()
})
