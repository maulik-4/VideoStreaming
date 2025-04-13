import React from "react";
import { FaHome, FaHistory, FaClock, FaThumbsUp } from "react-icons/fa";
import { SiYoutubeshorts } from "react-icons/si";
import { MdOutlineSubscriptions, MdVideoLibrary, MdPlaylistPlay } from "react-icons/md";
import { IoMdArrowDropdown } from "react-icons/io";
import './Sidebar.css'
const Sidebar = ({SideBar}) => {
  return (
    <div className="w-[25vw] h-screen py-4 bg-black text-white flex flex-col px-3 overflow-y-auto scrollbar-hide scrollbar-bg-black ">
      {/* First Section */}
      <div className="flex flex-col gap-3">
        <SidebarItem icon={<FaHome size={22} />} text="Home" />
        <SidebarItem icon={<SiYoutubeshorts size={22} />} text="Shorts" />
        <SidebarItem icon={<MdOutlineSubscriptions size={22} />} text="Subscriptions" />
      </div>
      <hr className="my-3 border-gray-700" />

      {/* Library Section */}
      <div className="flex flex-col gap-3">
        <SidebarItem icon={<MdVideoLibrary size={22} />} text="Library" />
        <SidebarItem icon={<FaHistory size={22} />} text="History" />
        <SidebarItem icon={<MdPlaylistPlay size={22} />} text="Your Videos" />
        <SidebarItem icon={<FaClock size={22} />} text="Watch Later" />
        <SidebarItem icon={<FaThumbsUp size={22} />} text="Liked Videos" />
        <SidebarItem icon={<IoMdArrowDropdown size={22} />} text="Show More" />
      </div>
      <hr className="my-3 border-gray-700" />

      {/* Subscription Channels */}
      <h2 className="text-gray-400 text-sm px-2">Subscriptions</h2>
      <div className="flex flex-col gap-3">
        <SidebarItem icon={<img src="https://via.placeholder.com/24" className="rounded-full w-6 h-6" />} text="Channel 1" />
        <SidebarItem icon={<img src="https://via.placeholder.com/24" className="rounded-full w-6 h-6" />} text="Channel 2" />
        <SidebarItem icon={<img src="https://via.placeholder.com/24" className="rounded-full w-6 h-6" />} text="Channel 3" />
        <SidebarItem icon={<IoMdArrowDropdown size={22} />} text="Show More" />
      </div>
      <hr className="my-3 border-gray-700" />

      {/* Explore Section */}
      <h2 className="text-gray-400 text-sm px-2">Explore</h2>
      <div className="flex flex-col gap-3">
        <SidebarItem icon={<FaHome size={22} />} text="Trending" />
        <SidebarItem icon={<FaHome size={22} />} text="Music" />
        <SidebarItem icon={<FaHome size={22} />} text="Gaming" />
        <SidebarItem icon={<FaHome size={22} />} text="News" />
        <SidebarItem icon={<FaHome size={22} />} text="Sports" />
      </div>
    </div>
  );
};

// Reusable Sidebar Item Component
const SidebarItem = ({ icon, text }) => {
  return (
    <div className="flex items-center gap-4 px-4 py-2 hover:bg-[#212121] rounded-lg cursor-pointer -scroll-my-px transition-all">
      {icon}
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
};

export default Sidebar;
