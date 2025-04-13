import React, { useState, useEffect } from 'react';
import Sidebar from '../Components/Sidebar/Sidebar';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { useSearch } from '../utils/SearchContext';

const Homepage = ({ SideBar }) => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const { search } = useSearch();

  const options = [
    "All", "Music", "Dramedy", "T-Series", "Tamil Cinema", "Mixes",
    "Albums", "Live", "Thrillers", "Watched", "RecentlyUploaded"
  ];

  useEffect(() => {
    axios.get("http://localhost:9999/api/getAllVideos")
      .then((res) => {
        const { data } = res.data;
        setVideos(data);
      })
      .catch((err) => console.log(err));
  }, []);

 
 const filteredVideos = videos.filter(video => 
  !video.user?.isBlocked && 
  (!search || video.title.toLowerCase().includes(search.toLowerCase()))
);

  return (
    <div className="flex relative min-h-screen bg-black text-white overflow-hidden">
      {SideBar && <Sidebar />}

      <div className="flex flex-col w-full">
        
        <div className="flex gap-3 p-4 overflow-x-auto scrollbar-hide snap-x">
          {options.map((item, index) => (
            <button
              key={index}
              className="bg-[#212121] hover:bg-[#383838] text-sm px-5 py-2 rounded-full whitespace-nowrap transition-all duration-200 snap-start"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 px-6 py-4">
          {filteredVideos.length > 0 ? (
            filteredVideos.map((video) => {
              const { _id, thumbnail, title, category, user, views, videoLink } = video;
              return (
                <div
                  key={_id}
                  onClick={() => navigate(`/watch/${_id}`, { state: { video } })}
                  className="cursor-pointer group"
                >
                  <div className="relative w-full h-[200px] rounded-xl overflow-hidden shadow-md group hover:shadow-lg transition-shadow duration-300">
                    <img
                      src={thumbnail}
                      alt={title}
                      className="w-full h-full object-cover rounded-xl transition-transform duration-300"
                    />
                    <video
                      src={videoLink}
                      muted
                      playsInline
                      autoPlay
                      className="absolute top-0 left-0 w-full h-full object-cover rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      onMouseOver={(e) => e.target.play()}
                      onMouseOut={(e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                  </div>

                  <div className="flex gap-3 mt-3 items-center flex-row">
                    <img
                      src={user?.profilePic || "https://via.placeholder.com/50"}
                      alt="User"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex flex-col">
                      <h2 className="text-base font-semibold line-clamp-2">{title}</h2>
                      <p className="text-sm">{user?.channelName || "Unknown Channel"}</p>
                      <p className="text-xs">{views} views</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center col-span-full text-gray-400">No videos found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
