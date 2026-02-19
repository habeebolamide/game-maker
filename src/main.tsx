import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from 'react-hot-toast'  // ← Add this

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-center"  // or "top-right", "bottom-right", etc.
      toastOptions={{
        duration: 4000,  // ms
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
          border: '1px solid #444',
        },
        success: {
          style: {
            background: '#166534',  // dark green
            border: '1px solid #22c55e',
          },
        },
        error: {
          style: {
            background: '#7f1d1d',  // dark red
            border: '1px solid #ef4444',
          },
        },
      }}
    />
  </React.StrictMode>,
)