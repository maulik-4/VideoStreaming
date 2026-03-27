import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { FaHome, FaHistory, FaClock, FaThumbsUp, FaFire, FaMusic, FaGamepad, FaNewspaper, FaRunning } from "react-icons/fa";
import { SiYoutubeshorts } from "react-icons/si";
import { MdOutlineSubscriptions, MdVideoLibrary, MdPlaylistPlay } from "react-icons/md";
import { IoMdArrowDropdown } from "react-icons/io";
import './Sidebar.css'
import axiosInstance from '../../utils/axiosConfig';

const Sidebar = ({SideBar}) => {
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    // Fetch subscribed channels for the logged-in user
    axiosInstance.get('/auth/subscriptions/list')
      .then(res => {
        if (res.data?.data) setSubs(res.data.data);
      })
      .catch(() => {})
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?._id) setCurrentUserId(parsed._id);
      } catch (e) {
        // ignore parse errors
      }
    }
  }, []);

  return (
    <div className={`
      ${SideBar ? 'w-[240px] px-3 py-4 overflow-y-auto' : 'w-0 px-0 py-0 overflow-hidden'} 
      h-screen text-main 
      flex-col scrollbar-hide scrollbar-bg-black
      transition-all duration-300 fixed z-40
      lg:flex lg:relative glass-card
    `} style={{borderRight:'1px solid rgba(255,255,255,0.03)'}}>
      {/* First Section */}
      <div className="flex flex-col gap-3">
        <SidebarItem icon={<FaHome size={20} className="text-red-400" />} text="Home" />
        <SidebarItem icon={<SiYoutubeshorts size={20} className="text-blue-400" />} text="Shorts" />
        <SidebarItem onClick={() => navigate('/subscriptions')} icon={<MdOutlineSubscriptions size={20} className="text-green-400" />} text="Subscriptions" />
      </div>
      <hr className="my-3 border-gray-800" />

      {/* Library Section */}
      <div className="flex flex-col gap-3">
        <SidebarItem onClick={() => navigate('/analytics')} icon={<MdVideoLibrary size={20} className="text-purple-400" />} text="Library" />
        <SidebarItem onClick={() => navigate('/history')} icon={<FaHistory size={20} className="text-blue-400" />} text="History" />
        <SidebarItem
          onClick={() => currentUserId ? navigate(`/profile/${currentUserId}`) : navigate('/login')}
          icon={<MdPlaylistPlay size={20} className="text-yellow-400" />}
          text="Your Videos"
        />
        <SidebarItem icon={<FaClock size={20} className="text-green-400" />} text="Watch Later" />
        <SidebarItem icon={<FaThumbsUp size={20} className="text-red-400" />} text="Liked Videos" />
        <SidebarItem icon={<IoMdArrowDropdown size={20} className="text-gray-400" />} text="Show More" />
      </div>
      <hr className="my-3 border-gray-800" />

      {/* Subscription Channels */}
      <h2 className="text-muted text-sm font-medium px-2 mb-2">Subscriptions</h2>
      <div className="flex flex-col gap-3">
        {subs.length === 0 && (
          <span className="px-3 text-sm opacity-60">No subscriptions yet</span>
        )}
        {subs.slice(0, 8).map((ch) => (
          <SidebarItem
            key={ch._id}
            onClick={() => navigate(`/profile/${ch._id}`)}
            icon={
              <div className="rounded-full w-8 h-8 overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                {ch.profilePic ? (
                  <img src={ch.profilePic} alt={ch.channelName || ch.userName} className="w-full h-full object-cover" />
                ) : (
                  (ch.channelName || ch.userName || '?').slice(0, 2).toUpperCase()
                )}
              </div>
            }
            text={ch.channelName || ch.userName || 'Channel'}
          />
        ))}
        {subs.length > 8 && (
          <SidebarItem icon={<IoMdArrowDropdown size={20} className="text-gray-400" />} text={`Show ${subs.length - 8} more`} onClick={() => navigate('/subscriptions')} />
        )}
      </div>
      <hr className="my-3 border-gray-800" />

      {/* Explore Section with Better Icons */}
      <h2 className="text-muted text-sm font-medium px-2 mb-2">Explore</h2>
      <div className="flex flex-col gap-3">
        <SidebarItem icon={<FaFire size={20} className="text-red-500" />} text="Trending" />
        <SidebarItem icon={<FaMusic size={20} className="text-blue-400" />} text="Music" />
        <SidebarItem icon={<FaGamepad size={20} className="text-green-400" />} text="Gaming" />
        <SidebarItem icon={<FaNewspaper size={20} className="text-yellow-400" />} text="News" />
        <SidebarItem icon={<FaRunning size={20} className="text-purple-400" />} text="Sports" />
      </div>
    </div>
  );
};

// Reusable Sidebar Item Component
const SidebarItem = ({ icon, text, onClick }) => {
  return (
    <div onClick={onClick} className="flex items-center gap-4 px-3 py-2 hover:translate-x-1 hover:shadow-lg rounded-lg cursor-pointer transition-all duration-200" style={{background:'transparent'}}>
      <div className="flex items-center justify-center w-8 h-8 rounded-full glass-card">{icon}</div>
      <span className="text-sm font-medium" style={{color:'var(--text)'}}>{text}</span>
    </div>
  );
};

export default Sidebar;