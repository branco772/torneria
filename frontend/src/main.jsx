import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import "./index.css"
import { AuthProvider } from "./auth/AuthContext"; // 👈 IMPORTANTE

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>   {/* 🔥 AQUI */}
      <App />
    </AuthProvider>
  </StrictMode>,
)