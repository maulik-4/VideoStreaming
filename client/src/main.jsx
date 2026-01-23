import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CloudinaryProvider } from './utils/CloudinaryContext.jsx'
import { SearchProvider } from './utils/SearchContext.jsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

createRoot(document.getElementById('root')).render(
  <SearchProvider>
    <CloudinaryProvider>
      <App />
      <ToastContainer position="bottom-right" autoClose={2500} />
    </CloudinaryProvider>,
  </SearchProvider>
)
