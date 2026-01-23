import { useState } from "react";
import { FaYoutube } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

const Login = () => {
    const navigate = useNavigate();
    const [user, setuser] = useState({ "userName": "", "password": "" });
    const [loading, setLoading] = useState(false);
    
    const handleInput = (event, name) => {
        setuser({
            ...user,
            [name]: event.target.value
        })
    }

    const handleLogin = async () => {
        if (!user.userName || !user.password) {
            toast.error("Please fill all fields");
            return;
        }
        
        setLoading(true);
        
        // Generate a unique device ID
        const deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        
        // Store the device ID in localStorage
        localStorage.setItem("deviceId", deviceId);
        
        axios.post("https://yotube-full-stack.onrender.com/auth/login", 
            { ...user, deviceId }, 
            { withCredentials: true }
        )
        .then((res) => {
            if(res.data.success === "yes"){
                const { user, token } = res.data;
                localStorage.setItem("token", token);
                document.cookie = `token=${token}; path=/; max-age=3600`; // Match JWT expiration (1 hour)
                localStorage.setItem("user", JSON.stringify(user));
                
                toast.success("Login Successful");
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                toast.error("Invalid Credentials");
            }
        })
        .catch((err) => {
            console.log(err);
            toast.error("Invalid Credentials");
        })
        .finally(() => {
            setLoading(false);
        });
    }

    return (
            <div className="min-h-screen flex justify-center items-center px-4 py-8" style={{background:'var(--bg)', color:'var(--text)'}}>
                <div className="login-container w-full max-w-md glass-card backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-xl">
                <div className="p-8 md:p-10">
                    {/* Header */}
                    <div className="flex justify-center items-center gap-3 mb-10">
                        <FaYoutube className="text-red-600 text-3xl md:text-4xl animate-pulse" />
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Login</h1>
                    </div>
                    
                    {/* Form */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={user.userName} 
                                    onChange={(e) => handleInput(e, "userName")}
                                        className="w-full rounded-lg px-4 py-3 placeholder:text-muted outline-none border border-soft focus:border-blue-500 transition-all duration-300 input-card"
                                    placeholder="Username" 
                                />
                            </div>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={user.password} 
                                    onChange={(e) => handleInput(e, "password")}
                                        className="w-full rounded-lg px-4 py-3 placeholder:text-muted outline-none border border-soft focus:border-blue-500 transition-all duration-300 input-card"
                                    placeholder="Password" 
                                />
                            </div>
                        </div>
                        
                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button 
                                type="submit" 
                                onClick={handleLogin}
                                disabled={loading}
                                className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                            <button 
                                onClick={() => navigate('/signup')}
                                className="flex-1 bg-transparent hover:opacity-90 text-main font-medium py-3 px-4 rounded-lg border border-soft transition-all duration-300"
                            >
                                Sign Up
                            </button>
                            <button 
                                onClick={() => navigate('/')}
                                className="flex-1 bg-card hover:opacity-90 text-main font-medium py-3 px-4 rounded-lg transition-all duration-300"
                            >
                                Cancel
                            </button>
                        </div>
                        
                        {/* Forgot password link */}
                        <div className="text-center mt-4">
                            <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-300">
                                Forgot password?
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        </div>
    )
}

export default Login;