import { io } from "socket.io-client";

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://yotube-full-stack.onrender.com';

const socket = io(baseURL, {
    withCredentials: true,
});

export default socket;