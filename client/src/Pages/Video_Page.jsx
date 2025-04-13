import React, { useEffect, useState } from 'react';
import Sidebar from '../Components/Sidebar/Sidebar';
import { IoIosNotificationsOutline, IoMdShareAlt } from 'react-icons/io';
import { AiFillLike, AiFillDislike } from 'react-icons/ai';
import { RiDownloadLine } from 'react-icons/ri';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from "react-toastify";


const Video_Page = ({ SideBar }) => {
  const { id } = useParams();
  const [video_Data, setvideo_Data] = useState(null);
  const [like, setLike] = useState();
  const [dislike, setdislike] = useState();
  const [views , setviews] = useState();
  const navigate = useNavigate();
  const HandleLikes = async () => {
    try {
      const res = await axios.put(`http://localhost:9999/api/like/${id}`);
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
      const res = await axios.put(`http://localhost:9999/api/dislike/${id}`);
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
  const HanldeShare = async()=>{
    try{
      await navigator.clipboard.writeText(`http://localhost:5173/watch/${id}`);
      alert("Link Copied to Clipboard") 
    }
    catch(err){
      console.log(err);
    }
  }
  const HandleViews = async() =>{
    try{
      const res =await axios.put(`http://localhost:9999/api/views/${id}`);
      setviews(res.data.views);
    }
    catch(err){
      console.log(err);
    }
  }

  useEffect(() => {
    axios.get(`http://localhost:9999/api/getAllVideos/${id}`)
      .then((res) => {
        const { data } = res.data;
        setvideo_Data(data);
        HandleViews();
      })
      .catch((err) => console.log(err));
  }, [id]);

  const videoLink = video_Data?.videoLink || 'https://www.w3schools.com/html/mov_bbb.mp4';
  const title = video_Data?.title || 'Loading...';
  const description = video_Data?.description || 'Loading...';
  const channelName = video_Data?.user?.channelName || 'Loading...';
  const profilePic = video_Data?.user?.profilePic || 'https://via.placeholder.com/150';
  const [videos, setVideos] = useState([]);
  console.log(views)

  useEffect(() => {
    axios.get("http://localhost:9999/api/getAllVideos")
      .then((res) => {
        const { data } = res.data;
        const unblockedVideos = data.filter(video => !video.user.isBlocked);
        setVideos(unblockedVideos);
      })
      .catch((err) => console.log(err));
  }, []);



  return (
    <div className="flex bg-black text-white min-h-screen w-full mt-[5vh] flex-col md:flex-row">
      {SideBar && <Sidebar />}
      <ToastContainer position="top-right" autoClose={1000} theme="dark" />

      <div className="flex flex-col px-4 md:px-12 w-full md:w-[70%]">

        <div className="bg-gray-900 w-full h-auto rounded-lg mb-4 overflow-hidden">
          <video
            src={videoLink}
            controls
           
            className="w-full h-[35vh] md:h-[70vh] object-cover rounded-xl"
          />
        </div>

        <div className="video_info space-y-4">
          <h1 className="font-bold text-xl md:text-3xl">{title}</h1>

          <div className="flex justify-between items-center flex-wrap gap-4">
            <div onClick={() => {
              navigate(`/profile/${video_Data?.user?._id}`)
            }} className="flex items-center gap-3">
              <img
                src={profilePic}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover"
                alt="User"
              />
              <h2 className="font-bold text-lg md:text-xl">{channelName}</h2>
              <button className="bg-gray-800 px-4 py-1 rounded-full flex items-center gap-2 text-base hover:bg-gray-700 transition">
                <IoIosNotificationsOutline />
                Subscribed
              </button>
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-gray-800 px-4 py-1 rounded-lg">
                <button onClick={HandleLikes} className="hover:text-blue-500 flex items-center gap-2">
                  <AiFillLike />
                  <span>{like || video_Data?.likes || 0}</span>
                </button>
                <button onClick={HandleDislike} className="hover:text-red-500 flex items-center gap-2">
                  <AiFillDislike />
                  <span>{dislike || video_Data?.dislike || 0}</span>
                </button>
              </div>
              <button onClick={HanldeShare} className="flex items-center gap-2 bg-gray-800 px-4 py-1 rounded-lg hover:bg-gray-700 text-base">
                <IoMdShareAlt />
                <span>Share</span>
              </button>
              <button className="flex items-center gap-2 bg-gray-800 px-4 py-1 rounded-lg hover:bg-gray-700 text-base">
                <RiDownloadLine />
                <span>Download</span>
              </button>
            </div>
          </div>

          <p className="text-gray-300">
            <span className='font-bold'>{views}  Views </span>  
            {description}</p>
        </div>
      </div>


      <div className="w-full md:w-[30%] px-4 mt-6 md:mt-0">
        <h2 className="text-xl font-bold mb-3">Suggested Videos</h2>
        <div className="space-y-4">
          {videos.map((video) => (
            <div key={video._id}>
              <div
                className="flex flex-col sm:flex-row gap-3 cursor-pointer"
                onClick={() => navigate(`/watch/${video._id}`)}
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full sm:w-40 h-40 sm:h-24 object-cover rounded-lg"
                />
                <div className="flex flex-col justify-between">
                  <h2 className="font-semibold text-base sm:text-lg line-clamp-2">
                    {video.title}
                  </h2>
                  <p className="text-gray-400 text-sm">{video.user?.channelName}</p>
                  <p className="text-gray-500 text-sm">{video.views} views</p>
                </div>
              </div>
              <hr className="border-gray-700 my-4" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Video_Page;
