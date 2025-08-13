import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Check if we should run in offline mode
console.log('🔍 Environment check:', {
  VITE_OFFLINE: import.meta.env.VITE_OFFLINE,
  NODE_ENV: import.meta.env.NODE_ENV
});

if (import.meta.env.VITE_OFFLINE === 'true') {
  (window as any).OFFLINE_WORKER = true;
  console.log('📁 OFFLINE MODE: Worker disabled, using local content');
} else {
  console.log('🌐 ONLINE MODE: Will try worker first');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)