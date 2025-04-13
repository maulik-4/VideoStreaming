import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CloudinaryProvider } from './utils/CloudinaryContext.jsx'

createRoot(document.getElementById('root')).render(
  <CloudinaryProvider>
  
    <App />
 
  </CloudinaryProvider>,
)
