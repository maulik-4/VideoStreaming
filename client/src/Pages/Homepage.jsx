import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Components/Sidebar/Sidebar';
import { useNavigate } from "react-router-dom";
import { useSearch } from '../utils/SearchContext';
import axiosInstance from '../utils/axiosConfig';
import ShimmerVideoCard from '../Components/ShimmerVideoCard';
import { toast } from 'react-toastify';
import VideoCard from '../Components/VideoCard'; // Correct import

const Homepage = ({ SideBar }) => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { search, setsearch } = useSearch();
  
  // Log the prop to verify it's passed correctly


  // Filter logic
  const filteredVideos = videos.filter(video =>
    !video.user?.isBlocked &&
    (!search || video.title.toLowerCase().includes(search.toLowerCase())) &&
    (selectedCategory === "All" || video.category === selectedCategory)
  );

  const categories = [
    "All","Test", "Music", "Comedy", "Gaming", "Tech", "Education", 
    "Sports", "Travel", "Food", "Fashion", "Science", "News"
  ];

  useEffect(() => {
    setLoading(true);
    axiosInstance.get("/api/getAllVideos")
      .then((res) => {
        const { data } = res.data;
        setVideos(data);
      })
      .catch((err) => {
        console.error("Error fetching videos:", err);
        toast.error("Failed to load videos. Please try again later.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex -mt-[8vh] relative min-h-screen" style={{background:'var(--bg)', color:'var(--text)'}}>
      {/* Make sure the prop is passed correctly */}
      <Sidebar SideBar={SideBar} />

      <div className="flex flex-col w-full overflow-x-hidden">
        <div className="sticky top-[60px] z-10 backdrop-blur-md glass-card pb-2 px-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent py-2">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category)}
                className={`${
                  selectedCategory === category
                    ? "accent-btn"
                    : "bg-card text-main hover:opacity-90"
                } text-sm px-5 py-2 rounded-full whitespace-nowrap transition-all duration-200 flex-shrink-0`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Videos Grid */}
        <div className="p-4  md:p-6 lg:p-8 mt-[5vh]  ">
          {/* Rest of the component remains the same */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <ShimmerVideoCard key={i} />
              ))}
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <VideoCard 
                  key={video._id} 
                  video={video} 
                  navigate={navigate} 
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-16">
              <div className="max-w-xl w-full glass-card p-8 rounded-xl text-center">
                <div className="mb-4 text-6xl">🔍</div>
                <h3 className="text-2xl font-semibold mb-2 text-main">We couldn't find anything</h3>
                <p className="text-muted mb-6">
                  {search
                    ? `No results for "${search}" in ${selectedCategory === 'All' ? 'any category' : selectedCategory}. Try adjusting your search or explore the suggestions below.`
                    : `No videos available in ${selectedCategory === 'All' ? 'any category' : selectedCategory}. Try a different category or explore popular picks.`}
                </p>

                <div className="flex flex-wrap justify-center gap-3 mb-4">
                  {['Music','Gaming','Tech','Education','Comedy'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setsearch(''); }}
                      className="px-4 py-2 rounded-full text-sm transition-colors accent-btn"
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3">
                  {search && (
                    <button
                      onClick={() => { setsearch(''); setSelectedCategory('All'); }}
                      className="px-4 py-2 rounded-lg border border-soft text-main hover:opacity-90"
                    >
                      Clear search
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedCategory('All'); setsearch(''); window.scrollTo({top:0, behavior:'smooth'}); }}
                    className="px-4 py-2 rounded-lg accent-btn"
                  >
                    Browse all videos
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Separate VideoCard component for better organization


export default Homepage;
