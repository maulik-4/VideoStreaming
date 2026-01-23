import React, { useEffect, useState } from 'react';
import Sidebar from '../Components/Sidebar/Sidebar';
import { IoIosNotificationsOutline, IoMdShareAlt } from 'react-icons/io';
import { AiFillLike, AiFillDislike } from 'react-icons/ai';
import { RiDownloadLine } from 'react-icons/ri';
import { BsDot } from 'react-icons/bs';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from "react-toastify";

const Video_Page = ({ SideBar }) => {
  const { id } = useParams();
  const [video_Data, setvideo_Data] = useState(null);
  const [like, setLike] = useState();
  const [dislike, setdislike] = useState();
  const [views, setviews] = useState();
  const navigate = useNavigate();
  const videoLink = video_Data?.videoLink || 'https://www.w3schools.com/html/mov_bbb.mp4';
  const title = video_Data?.title || 'Loading...';
  const description = video_Data?.description || 'Loading...';
  const channelName = video_Data?.user?.channelName || 'Loading...';
  const profilePic = video_Data?.user?.profilePic || 'https://via.placeholder.com/150';
  const [videos, setVideos] = useState([]);

  // All the handler functions remain the same
  const HandleLikes = async () => {
    try {
      const res = await axios.put(`https://yotube-full-stack.onrender.com/api/like/${id}`);
      const token = localStorage.getItem('token');
      if(!token){
        toast.error("Please Login to like the video");
        return;
      }
      setLike(res.data.likes);
    }
    catch (err) {
      console.log(err);
    }
  }
  
  const HandleDislike = async () => {
    try {
      const res = await axios.put(`https://yotube-full-stack.onrender.com/api/dislike/${id}`);
      const token = localStorage.getItem('token');
      if(!token){
        toast.error("Please Login to dislike the video");
        return;
      }
      setdislike(res.data.dislike);
    }
    catch (err) {
      console.log(err);
    }
  }
  
  const HanldeShare = async() => {
    try{
      await navigator.clipboard.writeText(`https://yotube-full-stack.onrender.com/watch/${id}`);
      toast.success("Link Copied to Clipboard");
    }
    catch(err){
      console.log(err);
    }
  }
  
  const HandleViews = async() => {
    try{
      const res = await axios.put(`https://yotube-full-stack.onrender.com/api/views/${id}`);
      setviews(res.data.views);
    }
    catch(err){
      console.log(err);
    }
  }

  // useEffect hooks remain the same
  useEffect(() => {
    axios.get(`https://yotube-full-stack.onrender.com/api/getAllVideos/${id}`)
      .then((res) => {
        const { data } = res.data;
        setvideo_Data(data);
        HandleViews();
      })
      .catch((err) => console.log(err));
  }, [id]);

  useEffect(() => {
    axios.get("https://yotube-full-stack.onrender.com/api/getAllVideos")
      .then((res) => {
        const { data } = res.data;
        const unblockedVideos = data.filter(video => !video.user.isBlocked);
        setVideos(unblockedVideos);
      })
      .catch((err) => console.log(err));
  }, []);

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex min-h-screen w-full md:flex-row flex-col" style={{background:'var(--bg)', color:'var(--text)'}}>
      {/* Pass the SideBar prop to the Sidebar component */}
      {SideBar && <Sidebar SideBar={SideBar} />}
      <ToastContainer position="top-right" autoClose={1000} theme="dark" />

      <div className={`flex-1 flex flex-col md:px-8 px-4 ${SideBar ? 'md:ml-0' : ''} transition-all duration-300`}>
        {/* Main content area */}
        <div className="flex flex-col md:flex-row gap-6 mt-4">
          {/* Video section */}
          <div className="w-full md:w-[70%]">
            {/* Video player */}
            <div className="relative w-full rounded-xl mb-4 overflow-hidden shadow-lg" style={{background:'var(--card)'}}>
              <video
                src={videoLink}
                controls
                className="w-full md:h-[500px] h-[240px] object-cover rounded-xl"
                poster={video_Data?.thumbnail}
              />
            </div>

            {/* Video info */}
            <div className="backdrop-blur-sm shadow-lg p-4 rounded-xl mb-6 glass-card">
              <h1 className="font-bold text-xl md:text-2xl mb-3">{title}</h1>
              
              <div className="flex items-center text-gray-400 text-sm mb-4">
                <span>{views || video_Data?.views || 0} views</span>
                <BsDot className="mx-1" />
                <span>{video_Data?.createdAt ? formatDate(video_Data.createdAt) : 'Recent'}</span>
              </div>

              {/* Channel and interaction buttons */}
              <div className="flex justify-between items-center flex-wrap gap-4 border-t border-b border-gray-700/50 py-4">
                <div 
                  onClick={() => navigate(`/profile/${video_Data?.user?._id}`)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <img
                    src={profilePic}
                    className="w-12 h-12 rounded-full object-cover"
                    alt="Channel"
                  />
                  <div>
                    <h2 className="font-bold text-base md:text-lg">{channelName}</h2>
                    <p className="text-xs text-muted">{video_Data?.user?.subscribers || 0} subscribers</p>
                  </div>
                  <button className="ml-2 px-4 py-1.5 rounded-full flex items-center gap-2 text-sm transition-colors bg-card hover:opacity-90 hidden sm:flex">
                    <IoIosNotificationsOutline size={18} />
                    <span>Subscribe</span>
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <div className="flex rounded-full overflow-hidden bg-card/80">
                    <button 
                      onClick={HandleLikes} 
                      className="px-4 py-2 flex items-center gap-1.5 hover:bg-blue-500/10 transition-colors border-r border-gray-700/50"
                    >
                      <AiFillLike size={18} className="text-blue-400" />
                      <span className="text-sm">{like || video_Data?.likes || 0}</span>
                    </button>
                    <button 
                      onClick={HandleDislike} 
                      className="px-4 py-2 flex items-center gap-1.5 hover:bg-red-500/10 transition-colors"
                    >
                      <AiFillDislike size={18} className="text-red-400" />
                      <span className="text-sm">{dislike || video_Data?.dislike || 0}</span>
                    </button>
                  </div>
                  
                  <button onClick={HanldeShare} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors bg-card hover:opacity-90">
                    <IoMdShareAlt size={18} />
                    <span>Share</span>
                  </button>
                  
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors bg-card hover:opacity-90">
                    <RiDownloadLine size={18} />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4 p-4 rounded-lg glass-card">
                <p className="text-muted text-sm leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {/* Suggested videos section */}
            <div className="w-full md:w-[30%]">
            <h2 className="text-lg font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Suggested Videos</h2>
            <div className="flex flex-col gap-4">
              {videos.map((video) => (
                <div 
                  key={video._id} 
                  className="transition-colors duration-300 rounded-lg overflow-hidden shadow-md cursor-pointer glass-card"
                  onClick={() => navigate(`/watch/${video._id}`)}
                >
                  <div className="flex flex-col">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-32 object-cover"
                      loading="lazy"
                    />
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
                      <p className="text-muted text-xs mt-1">{video.user?.channelName}</p>
                      <div className="flex items-center text-muted text-xs mt-1">
                        <span>{video.views} views</span>
                        <BsDot className="mx-1" />
                        <span>{formatDate(video.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Video_Page;
