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
    await Promise.race([
      worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      }),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ])
    console.log('[MSW] Worker initialized successfully')
  } catch (error) {
    console.error('[MSW] Failed to start worker:', error)
  }
}

// Fallback timer ensures React mounts within 1 second even if ServiceWorker activation hangs on refresh
const fallbackTimer = setTimeout(() => {
  renderApp()
}, 1000)

enableMocking().finally(() => {
  clearTimeout(fallbackTimer)
  renderApp()
})
