import { useState } from "react";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaYoutube, FaInfoCircle, FaCloudUploadAlt } from "react-icons/fa";

const Signup = () => {
  const [usersign, setusersign] = useState({
    userName: "",
    email: "",
    password: "",
    channelName: "",
    about: "",
    profilePic: "",
  });
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  
  const handleSignin = (event, name) => {
    setusersign({
      ...usersign,
      [name]: event.target.value,
    });
  };

  const handleupload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formdata = new FormData();
    formdata.append("file", file);
    formdata.append("upload_preset", "yotube");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/de7gqhlpj/image/upload",
        {
          method: "POST",
          body: formdata,
        }
      );

      const data = await res.json();

      if (res.ok && data.secure_url) {
        setusersign((prev) => ({
          ...prev,
          profilePic: data.secure_url,
        }));
        toast.success("Profile picture uploaded successfully!");
      } else {
        toast.error(data.error?.message || "Failed to upload image");
      }
    } catch (err) {
      toast.error("Network or server error");
    } finally {
      setUploading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!usersign.profilePic) {
      toast.warning("Please upload a profile picture");
      return;
    }

    try {
      const res = await axios.post("https://yotube-full-stack.onrender.com/auth/signup", usersign);
      toast.success(res.data.message || "User signed up successfully!");
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed.");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-12 px-4" style={{background:'var(--bg)', color:'var(--text)'}}>
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <FaYoutube className="text-red-600 text-4xl mr-2" />
            <h1 className="text-2xl font-bold text-main">YouTube Clone</h1>
          </div>
          <p className="text-muted">Create your account to start sharing videos</p>
        </div>
        
        {/* Form container */}
        <div className="glass-card backdrop-blur-sm rounded-xl shadow-xl border border-soft overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-bold text-main text-center mb-6">Sign Up</h2>
            
            <form className="space-y-5" onSubmit={handleSignUp}>
              {/* Username input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted flex items-center">
                  <FaUser className="mr-2 text-muted" />
                  Username
                </label>
                <input type="text" name="userName" value={usersign.userName} onChange={(e) => handleSignin(e, "userName")} placeholder="Enter your username" className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-soft input-card" required />
              </div>
              
              {/* Email input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted flex items-center">
                  <FaEnvelope className="mr-2 text-muted" />
                  Email
                </label>
                <input type="email" name="email" value={usersign.email} onChange={(e) => handleSignin(e, "email")} placeholder="Enter your email address" className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-soft input-card" required />
              </div>
              
              {/* Password input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted flex items-center">
                  <FaLock className="mr-2 text-muted" />
                  Password
                </label>
                <input type="password" name="password" value={usersign.password} onChange={(e) => handleSignin(e, "password")} placeholder="Create a password" className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-soft input-card" required />
              </div>
              
              {/* Channel name input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted flex items-center">
                  <FaYoutube className="mr-2 text-muted" />
                  Channel Name
                </label>
                <input type="text" name="channelName" value={usersign.channelName} onChange={(e) => handleSignin(e, "channelName")} placeholder="Name your channel" className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-soft input-card" required />
              </div>
              
              {/* About input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted flex items-center">
                  <FaInfoCircle className="mr-2 text-muted" />
                  About
                </label>
                <textarea name="about" value={usersign.about} onChange={(e) => handleSignin(e, "about")} placeholder="Tell viewers about your channel..." className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-soft resize-none input-card" rows={3} required />
              </div>
              
              {/* Profile picture upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <FaCloudUploadAlt className="mr-2 text-gray-400" />
                  Profile Picture
                </label>
                
                <div className="flex items-center justify-center">
                  <label className="w-full flex flex-col items-center px-4 py-6 rounded-lg shadow-lg tracking-wide border border-soft cursor-pointer hover:opacity-90 input-card">
                    <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                    </svg>
                    <span className="mt-2 text-base leading-normal">
                      {uploading ? "Uploading..." : "Select a file"}
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleupload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                
                {/* Profile picture preview */}
                {usersign.profilePic && (
                  <div className="mt-4 flex justify-center">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700">
                      <img
                        src={usersign.profilePic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Submit button */}
              <button type="submit" disabled={!usersign.profilePic || uploading} className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${usersign.profilePic && !uploading ? "bg-red-600 hover:bg-red-700 text-white" : "bg-card text-muted cursor-not-allowed"}`}>
                {uploading ? "Uploading..." : "Create Account"}
              </button>
              
              {/* Login link */}
              <div className="text-center mt-4">
                <p className="text-gray-400">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300">
                    Log in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
};

export default Signup;
