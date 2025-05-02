// Add this file to your project
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://yotube-full-stack.onrender.com',
  withCredentials: true
});

// Add device ID to every request
axiosInstance.interceptors.request.use(config => {
  const deviceId = localStorage.getItem('deviceId');
  if (deviceId) {
    config.headers['X-Device-ID'] = deviceId;
  }
  return config;
});

export default axiosInstance;