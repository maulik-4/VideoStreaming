import React from "react";
import { useNavigate } from 'react-router-dom';
import { FaHome, FaHistory, FaClock, FaThumbsUp, FaFire, FaMusic, FaGamepad, FaNewspaper, FaRunning } from "react-icons/fa";
import { SiYoutubeshorts } from "react-icons/si";
import { MdOutlineSubscriptions, MdVideoLibrary, MdPlaylistPlay } from "react-icons/md";
import { IoMdArrowDropdown } from "react-icons/io";
import './Sidebar.css'

const Sidebar = ({SideBar}) => {
  const navigate = useNavigate();

  return (
    <div className={`
      ${SideBar ? 'w-[25vw] md:w-[240px]' : 'w-0 px-0 overflow-hidden'} 
      h-screen py-4 text-main 
      flex flex-col px-3 overflow-y-auto scrollbar-hide scrollbar-bg-black
      transition-all duration-300 fixed md:relative z-40
      hidden lg:block glass-card
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
        <SidebarItem icon={<MdVideoLibrary size={20} className="text-purple-400" />} text="Library" />
        <SidebarItem onClick={() => navigate('/history')} icon={<FaHistory size={20} className="text-blue-400" />} text="History" />
        <SidebarItem icon={<MdPlaylistPlay size={20} className="text-yellow-400" />} text="Your Videos" />
        <SidebarItem icon={<FaClock size={20} className="text-green-400" />} text="Watch Later" />
        <SidebarItem icon={<FaThumbsUp size={20} className="text-red-400" />} text="Liked Videos" />
        <SidebarItem icon={<IoMdArrowDropdown size={20} className="text-gray-400" />} text="Show More" />
      </div>
      <hr className="my-3 border-gray-800" />

      {/* Subscription Channels */}
      <h2 className="text-muted text-sm font-medium px-2 mb-2">Subscriptions</h2>
      <div className="flex flex-col gap-3">
        <SidebarItem icon={<div className="rounded-full w-6 h-6 bg-gradient-to-br from-red-500 to-orange-500 shadow-inner"></div>} text="Channel 1" />
        <SidebarItem icon={<div className="rounded-full w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 shadow-inner"></div>} text="Channel 2" />
        <SidebarItem icon={<div className="rounded-full w-6 h-6 bg-gradient-to-br from-green-500 to-teal-500 shadow-inner"></div>} text="Channel 3" />
        <SidebarItem icon={<IoMdArrowDropdown size={20} className="text-gray-400" />} text="Show More" />
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