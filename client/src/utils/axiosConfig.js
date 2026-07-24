// Add this file to your project
import axios from 'axios';

// Prefer env override (Vite) so we can point to staging/local easily
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://yotube-full-stack.onrender.com';

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true
});

// Add device ID and authorization token to every request
axiosInstance.interceptors.request.use(config => {
  const deviceId = localStorage.getItem('deviceId');
  if (deviceId) {
    config.headers['X-Device-ID'] = deviceId;
  }
  
  // Add Bearer token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
});

export default axiosInstance;