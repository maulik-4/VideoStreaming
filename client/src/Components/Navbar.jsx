import { MdMenu } from "react-icons/md";
import { FaYoutube, FaSearch, FaMicrophone, FaPlus } from "react-icons/fa";
import { IoIosNotificationsOutline } from "react-icons/io";
import { RiLogoutBoxRLine, RiUserLine } from "react-icons/ri";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCloudinary } from "../utils/CloudinaryContext";
import { useSearch } from "../utils/SearchContext";
import axios from "axios";
import axiosInstance from "../utils/axiosConfig";

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
      setsearch(transcript);
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
    localStorage.removeItem("deviceId");
    
    axiosInstance.get("/auth/logout")
      .then(() => {
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-black text-white sticky top-0 z-50 shadow-lg shadow-black/50 backdrop-blur-sm">
      <div className="h-[60px] px-1 sm:px-4 md:px-6 lg:px-10 flex items-center justify-between max-w-[2000px] mx-auto">
        {/* Left - Slightly smaller */}
        <div className="flex items-center gap-1 sm:gap-4">
          <MdMenu 
            size={24} 
            className="cursor-pointer p-1 hover:bg-gray-700 rounded-full transition-colors" 
            onClick={SidbarHidden} 
          />
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-0 sm:gap-2 cursor-pointer group"
          >
            <FaYoutube className="text-red-600 text-xl sm:text-3xl group-hover:animate-pulse transition-all" />
            <h1 className="text-sm sm:text-xl font-bold tracking-tight group-hover:tracking-normal transition-all duration-300">YouTube</h1>
          </div>
        </div>

        {/* Middle - Smaller on mobile */}
        <form 
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-1 w-full max-w-[150px] xs:max-w-[250px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] mx-1 sm:mx-2"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              className="w-full px-2 sm:px-5 py-1 sm:py-2 rounded-full text-white outline-none border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all duration-200 bg-gray-900/70 placeholder:text-gray-400 text-xs md:text-base"
              placeholder="Search"
            />
            <button 
              type="submit"
              className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-1 sm:p-1.5 rounded-full hover:bg-gray-700 transition-colors"
            >
              <FaSearch size={12} className="sm:text-base" />
            </button>
          </div>
          <button
            type="button"
            title={isListening ? "Listening..." : "Search with voice"}
            onClick={() => {
              if (recognitionRef.current && !isListening) {
                setIsListening(true);
                recognitionRef.current.start();
              }
            }}
            className={`hidden sm:block p-2 rounded-full cursor-pointer transition-all duration-300 ${
              isListening 
                ? "bg-blue-700 animate-pulse" 
                : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            <FaMicrophone size={18} />
          </button>
        </form>

        {/* Right section - BOTH CREATE AND PROFILE ALWAYS VISIBLE */}
        <div className="flex items-center gap-0.5 xs:gap-2 sm:gap-4 ml-0.5 sm:ml-0">
          {/* Create button - ALWAYS VISIBLE */}
          <div
            className="flex items-center bg-gray-800 px-1 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-pointer hover:bg-gray-700 transition-colors whitespace-nowrap"
            onClick={() => navigate("/upload")}
          >
            <FaPlus size={10} className="sm:text-base" />
            <span className="ml-1 hidden sm:!inline text-sm">Create</span>
          </div>
          
          {/* Notifications (hidden on small screens) */}
          <div className="relative group hidden sm:block">
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full hidden group-hover:block"></div>
            <IoIosNotificationsOutline
              size={28}
              className="bg-gray-800 p-1.5 rounded-full cursor-pointer hover:bg-gray-700 transition-colors"
            />
          </div>

          {/* Profile - ALWAYS VISIBLE */}
          <div className="relative flex" ref={loginRef}>
            <img
              src={imageUrl || profPic}
              onClick={() => setShowLogin(!showLogin)}
              className="w-7 h-7 sm:w-9 sm:h-9 object-cover rounded-full cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all duration-300"
              alt="Profile"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpCKq1XnPYYDaUIlwlsvmLPZ-9-rdK28RToA&s";
              }}
            />
            
            {/* Dropdown remains the same */}
            {showLogin && (
              <div className="absolute right-0 top-10 sm:top-12 bg-gray-800/95 backdrop-blur-sm text-white rounded-xl shadow-xl w-48 flex flex-col z-50 border border-gray-700 overflow-hidden animate-fadeIn">
                {token && (
                  <button
                    className="py-3 px-4 hover:bg-gray-700 transition-colors flex items-center gap-2 text-left"
                    onClick={() => {
                      navigate(`/profile/${id}`);
                      setShowLogin(false);
                    }}
                  >
                    <RiUserLine size={18} />
                    <span>Your Profile</span>
                  </button>
                )}
                
                {!token && (
                  <button
                    onClick={() => {
                      navigate("/login");
                      setShowLogin(false);
                    }}
                    className="py-3 px-4 hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <RiUserLine size={18} />
                    <span>Sign In</span>
                  </button>
                )}
                
                {token && (
                  <button
                    onClick={handleLogout}
                    className="py-3 px-4 hover:bg-red-700 transition-colors flex items-center gap-2 text-left"
                  >
                    <RiLogoutBoxRLine size={18} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
