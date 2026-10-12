import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@babylonjs/core/Audio/audioSceneComponent";
import './index.css'
import App from './App.tsx'

import { AuthProvider } from './store/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
