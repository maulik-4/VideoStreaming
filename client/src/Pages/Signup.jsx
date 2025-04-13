import { useState } from "react";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
const Signup = () => {
  const [usersign, setusersign] = useState({
    userName: "",
    email: "",
    password: "",
    channelName: "",
    about: "",
    profilePic: "",
  });
  const navigate = useNavigate();
  const handleSignin = (event, name) => {
    setusersign({
      ...usersign,
      [name]: event.target.value,
    });
  };

  const handleupload = async (e) => {
    const file = e.target.files[0];
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
        console.log("✅ Image uploaded:", data.secure_url);
      } else {
        console.error(
          "❌ Upload failed:",
          data.error?.message || "No secure_url returned."
        );
      }
    } catch (err) {
      console.error("⚠️ Network or server error:", err);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!usersign.profilePic) {
      alert("Please wait for the profile picture to upload.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:9999/auth/signup", usersign);
      console.log("✅ User signed up:", res.data);
      toast.success(res.data.message || "User signed up successfully!");
      navigate('/')

      // Optionally clear form or redirect
    } catch (err) {
      console.error("❌ Signup error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Signup failed.");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-md p-8 bg-black border-gray-500 border-solid border-2 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Sign Up</h2>
        <form className="space-y-4" onSubmit={handleSignUp}>
          <input
            type="text"
            name="userName"
            value={usersign.userName}
            onChange={(e) => handleSignin(e, "userName")}
            placeholder="Username"
            className="w-full p-3 bg-gray-700 text-white rounded"
            required
          />
          <input
            type="email"
            name="email"
            value={usersign.email}
            onChange={(e) => handleSignin(e, "email")}
            placeholder="Email"
            className="w-full p-3 bg-gray-700 text-white rounded"
            required
          />
          <input
            type="password"
            name="password"
            value={usersign.password}
            onChange={(e) => handleSignin(e, "password")}
            placeholder="Password"
            className="w-full p-3 bg-gray-700 text-white rounded"
            required
          />
          <input
            type="text"
            name="channelName"
            value={usersign.channelName}
            onChange={(e) => handleSignin(e, "channelName")}
            placeholder="Channel Name"
            className="w-full p-3 bg-gray-700 text-white rounded"
            required
          />
          <textarea
            name="about"
            value={usersign.about}
            onChange={(e) => handleSignin(e, "about")}
            placeholder="About your channel..."
            className="w-full p-3 bg-gray-700 text-white rounded resize-none"
            rows={3}
            required
          />
          <input
            type="file"
            onChange={handleupload}
            className="w-full text-white bg-[#212121] p-2 rounded"
          />

          {usersign.profilePic && (
            <img
              src={usersign.profilePic}
              alt="Uploaded preview"
              className="mt-4 w-full rounded-lg shadow-md"
            />
          )}

          <button
            type="submit"
            disabled={!usersign.profilePic}
            className={`w-full p-3 rounded ${
              usersign.profilePic
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-500 cursor-not-allowed"
            } text-white`}
          >
            Sign Up
          </button>
        </form>
      </div>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
    
  );
};

export default Signup;
