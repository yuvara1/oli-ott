import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { MovieProvider } from './MovieContext'
import { GoogleOAuthProvider } from '@react-oauth/google'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '422702041209-2dmcltdmsj9vaoga8vq52naprgl6b0a5.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <MovieProvider>
        <App />
      </MovieProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
