import React from 'react'
import { createRoot } from 'react-dom/client'
import WalletConcept from './concept/WalletConcept'
import './concept/concept.css'
import './concept/wallet-reference.css'
import './concept/asset-reference.css'
createRoot(document.getElementById('root')).render(<React.StrictMode><WalletConcept /></React.StrictMode>)
if ('serviceWorker' in navigator) window.addEventListener('load', async () => {
  if (import.meta.env.PROD) { try { await navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' }) } catch (e) { console.warn('Offline unavailable', e) } }
  else for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister()
})
