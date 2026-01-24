// Add this file to your project
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://yotube-full-stack.onrender.com',
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