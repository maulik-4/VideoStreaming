import { MdMenu } from "react-icons/md";
import { FaYoutube, FaSearch, FaMicrophone, FaPlus } from "react-icons/fa";
import { IoIosNotificationsOutline } from "react-icons/io";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCloudinary } from "../utils/CloudinaryContext";
import { useSearch } from "../utils/SearchContext";
import axios from "axios";

const Navbar = ({ SideBar, SidbarHidden }) => {
  const navigate = useNavigate();
  const { search, setsearch } = useSearch();
  const [showLogin, setShowLogin] = useState(false);
  const loginRef = useRef(null);
  const { imageUrl } = useCloudinary();
  const [id, setid] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const token = localStorage.getItem("token");
  const [profPic, setProfPic] = useState(
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpCKq1XnPYYDaUIlwlsvmLPZ-9-rdK28RToA&s"
  );




  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (loginRef.current && !loginRef.current.contains(event.target)) {
        setShowLogin(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.profilePic || parsedUser?._id) {
          setProfPic(parsedUser.profilePic);
          setid(parsedUser._id);
        }
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
      }
    }
  }, []);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition API not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setsearch(transcript); // ✅ Use context function correctly
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [setsearch]);



  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    axios
      .get("https://yotube-full-stack.onrender.com/auth/logout")
      .then((res) => {
       
        window.location.reload();

      })
      .catch((err) => {
        console.log(err);
      });
    navigate("/login");
  };

  const handleSearchChange = (e) => {
    setsearch(e.target.value);
  };

  return (
    <nav className="bg-black text-white h-[60px] px-4 md:px-10 flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-4">
        <MdMenu size={30} className="cursor-pointer" onClick={SidbarHidden} />
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FaYoutube color="red" size={32} />
          <h1 className="text-lg md:text-xl font-bold">YouTube</h1>
        </div>
      </div>

      {/* Middle */}
      <div className="flex items-center gap-3 w-full max-w-[600px]">
        <div className="relative w-full">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            className="w-full px-5 py-2 rounded-full text-white outline-none border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 bg-black"
            placeholder="Search"
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700 transition">
            <FaSearch size={18} />
          </button>
        </div>
        <FaMicrophone
          size={38}
          title={isListening ? "Listening..." : "Click to Speak"}
          onClick={() => {
            if (recognitionRef.current && !isListening) {
              setIsListening(true);
              recognitionRef.current.start();
            }
          }}
          className={`hidden md:block p-2 rounded-full cursor-pointer transition ${isListening ? "bg-blue-700 animate-pulse" : "bg-gray-800 hover:bg-gray-700"
            }`}
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div
          className="flex items-center bg-gray-800 px-3 py-2 rounded-full cursor-pointer hover:bg-gray-700 transition"
          onClick={() => navigate("/upload")}
        >
          <FaPlus />
          <span className="ml-2 hidden md:inline">Create</span>
        </div>
        <IoIosNotificationsOutline
          size={32}
          className="bg-gray-800 p-2 rounded-full cursor-pointer"
        />

        <div className="relative" ref={loginRef}>
          <img
            src={imageUrl || profPic}
            onClick={() => setShowLogin(!showLogin)}
            className="w-10 h-10 object-cover rounded-full cursor-pointer"
            alt="Profile"
          />
          {showLogin && (
            <div className="absolute right-0 top-12 bg-gray-800 text-white rounded-lg shadow-lg w-40 flex flex-col z-50">
              {token && (
                <button
                  className="py-2 px-4 hover:bg-gray-700"
                  onClick={() => navigate(`/profile/${id}`)}
                >
                  Profile
                </button>
              )}
              {!token && (
                <button
                  onClick={() => navigate("/login")}
                  className="py-2 px-4 hover:bg-gray-700"
                >
                  Login
                </button>
              )}
              {token && (
                <button
                  onClick={handleLogout}
                  className="py-2 px-4 hover:bg-gray-700"
                >
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
