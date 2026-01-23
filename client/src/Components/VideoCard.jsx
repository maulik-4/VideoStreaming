import React, { useEffect, useRef, useState } from 'react';

const VideoCard = ({ video, navigate }) => {
    const { _id, thumbnail, title, category, user, views, videoLink, createdAt } = video;
    const [isHovering, setIsHovering] = useState(false);
    const videoRef = useRef(null);
    
    // Format the date
    const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Format view count
    const formatViews = (count) => {
      if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
      } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
      }
      return count;
    };
  
    useEffect(() => {
      if (isHovering && videoRef.current) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }
      
      return () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      };
    }, [isHovering]);
  
    return (
      <div
          onClick={() => navigate(`/watch/${_id}`, { state: { video } })}
          className="flex flex-col rounded-lg overflow-hidden transition-all duration-300 cursor-pointer glass-card hover:shadow-2xl hover:scale-[1.01]"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="relative w-full pt-[56.25%]"> {/* 16:9 aspect ratio */}
          <img
            src={thumbnail}
            alt={title}
              className={`absolute top-0 left-0 w-full h-full object-cover ${isHovering ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            loading="lazy"
          />
          <video
            ref={videoRef}
            src={videoLink}
            muted
            playsInline
            loop
              className={`absolute top-0 left-0 w-full h-full object-cover ${isHovering ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onLoadedData={(e) => {
              if (isHovering) {
                e.target.play().catch(() => {});
              }
            }}
          />
            <div className="absolute bottom-3 right-3 text-[11px] font-medium px-2 py-1 rounded-lg glass-card" style={{border:'1px solid rgba(255,255,255,0.04)'}}>
              {formatViews(views)} views
            </div>
            <div className="absolute bottom-3 left-3 text-[11px] font-semibold px-2 py-1 rounded-lg" style={{background:'linear-gradient(90deg,var(--accent),var(--accent-2))', color:'#fff'}}>
              {category}
            </div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/20 to-transparent opacity-30 pointer-events-none"></div>
        </div>
  
        <div className="p-3">
          <div className="flex gap-3">
            <img
              src={user?.profilePic || "https://via.placeholder.com/40"}
              alt={user?.channelName || "Channel"}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-1 ring-white/5"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium line-clamp-2 text-sm leading-tight mb-1" style={{color:'var(--text)'}}>
                {title}
              </h3>
              <p className="text-gray-300 text-xs mb-1 truncate" style={{color:'var(--muted)'}}>
                {user?.channelName || "Unknown Channel"}
              </p>
              <p className="text-gray-400 text-xs" style={{color:'var(--muted)'}}>
                {formattedDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
};
export default VideoCard;