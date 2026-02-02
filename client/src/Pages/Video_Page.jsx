import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '../Components/Sidebar/Sidebar';
import { IoIosNotificationsOutline, IoMdShareAlt } from 'react-icons/io';
import { AiFillLike, AiFillDislike } from 'react-icons/ai';
import { RiDownloadLine } from 'react-icons/ri';
import { BsDot } from 'react-icons/bs';
import axios from 'axios';
import axiosInstance from '../utils/axiosConfig';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from "react-toastify";
import historyTracker from '../utils/historyTracker';
      
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
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // History tracking refs
  const videoRef = useRef(null);
  const historyTrackerRef = useRef(null);
  const [resumeTime, setResumeTime] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // All the handler functions remain the same
  const HandleLikes = async () => {
    try {
      const res = await axiosInstance.put(`/api/like/${id}`);
      const token = localStorage.getItem('token');
      if(!token){
        toast.error("Please Login to like the video");
        return;
      }
      setLike(res.data.likes);
    }
    catch (err) {
      
    }
  }
  
  const HandleDislike = async () => {
    try {
      const res = await axiosInstance.put(`/api/dislike/${id}`);
      const token = localStorage.getItem('token');
      if(!token){
        toast.error("Please Login to dislike the video");
        return;
      }
      setdislike(res.data.dislike);
    }
    catch (err) {
      
    }
  }
  
  const HanldeShare = async() => {
    try{
      await navigator.clipboard.writeText(`${window.location.origin}/watch/${id}`);
      toast.success("Link Copied to Clipboard");
    }
    catch(err){
      
    }
  }
  
  const HandleViews = async() => {
    try{
      const res = await axiosInstance.put(`/api/views/${id}`);
      setviews(res.data.views);
    }
    catch(err){
      
    }
  }

  // useEffect hooks remain the same
  useEffect(() => {
    axiosInstance.get(`/api/getAllVideos/${id}`)
      .then((res) => {
        const { data } = res.data;
        setvideo_Data(data);
        setEditTitle(data.title || '');
        setEditDescription(data.description || '');
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        setSubscribed((currentUser.subscriptions || []).includes(data.user?._id));
        HandleViews();
        
        // Load resume time from history
        loadResumeTime(id);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    axiosInstance.get('/api/getAllVideos')
      .then((res) => {
        const { data } = res.data;
        const unblockedVideos = data.filter(video => !video.user.isBlocked);
        setVideos(unblockedVideos);
      })
      .catch(() => {});
  }, []);

  const postComment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return toast.error('Please login to comment');
      await axiosInstance.post(`/api/${id}/comments`, { text: commentText });
      const videoRes = await axiosInstance.get(`/api/getAllVideos/${id}`);
      setvideo_Data(videoRes.data.data);
      setCommentText('');
      toast.success('Comment added');
    } catch (err) {
      
      toast.error('Failed to add comment');
    }
  };

  const startEditComment = (c) => {
    setEditingCommentId(c._id);
    setEditingCommentText(c.text);
  };

  const saveEditComment = async () => {
    try {
      await axiosInstance.put(`/api/${id}/comments/${editingCommentId}`, { text: editingCommentText });
      const videoRes = await axiosInstance.get(`/api/getAllVideos/${id}`);
      setvideo_Data(videoRes.data.data);
      setEditingCommentId(null);
      setEditingCommentText('');
      toast.success('Comment updated');
    } catch (err) {
      
      toast.error('Failed to update comment');
    }
  };

  const toggleEditVideo = () => {
    setIsEditingVideo(!isEditingVideo);
  };

  const saveVideoEdits = async () => {
    try {
      await axiosInstance.put(`/api/${id}`, { title: editTitle, description: editDescription });
      const videoRes = await axiosInstance.get(`/api/getAllVideos/${id}`);
      setvideo_Data(videoRes.data.data);
      setIsEditingVideo(false);
      toast.success('Video updated');
    } catch (err) {
      
      toast.error('Failed to update video');
    }
  };

  const handleSubscribe = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return toast.error('Please login to subscribe');
      if (subscribed) {
        await axiosInstance.post(`/auth/unsubscribe/${video_Data.user._id}`);
        setSubscribed(false);
        toast.success('Unsubscribed');
      } else {
        await axiosInstance.post(`/auth/subscribe/${video_Data.user._id}`);
        setSubscribed(true);
        toast.success('Subscribed');
      }
    } catch (err) {
      
      toast.error('Subscription failed');
    }
  };

  // Load resume time from history
  const loadResumeTime = async (videoId) => {
    const history = await historyTracker.getVideoHistory(videoId, 'local');
    if (history && history.progress > 5 && history.watchPercentage < 95) {
      setResumeTime(history.progress);
      setShowResumePrompt(true);
    }
  };

  // Handle video time update (track progress)
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !video_Data) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    if (currentTime > 5) { // Only track after 5 seconds
      historyTracker.trackProgress({
        videoId: id,
        platform: 'local',
        progress: currentTime,
        duration: duration,
        title: video_Data.title,
        thumbnail: video_Data.thumbnail,
        channelName: video_Data.user?.channelName || 'Unknown'
      });
    }
  };

  // Handle resume playback
  const handleResumeClick = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = resumeTime;
      videoRef.current.play();
      setShowResumePrompt(false);
    }
  };

  // Cleanup on unmount - Save progress immediately
  useEffect(() => {
    return () => {
      
      // Save current progress immediately before leaving
      if (videoRef.current && video_Data) {
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        
        if (currentTime > 5) {
          historyTracker.trackProgress({
            videoId: id,
            platform: 'local',
            progress: currentTime,
            duration: duration,
            title: video_Data.title,
            thumbnail: video_Data.thumbnail,
            channelName: video_Data.user?.channelName || 'Unknown'
          });
          
          // Force save by clearing debounce timeout
          historyTracker.DEBOUNCE_TIME = 0;
          historyTracker.saveNow();
          historyTracker.DEBOUNCE_TIME = 5000; // Reset debounce
        }
      }
    };
  }, [id, video_Data]);

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
                ref={videoRef}
                src={videoLink}
                controls
                className="w-full md:h-[500px] h-[240px] object-cover rounded-xl"
                poster={video_Data?.thumbnail}
                onTimeUpdate={handleVideoTimeUpdate}
                onLoadedMetadata={() => {
                  // Auto-resume if there's a saved position
                  if (resumeTime > 5 && videoRef.current && !showResumePrompt) {
                    videoRef.current.currentTime = resumeTime;
                  }
                }}
              />
              
              {/* Resume playback prompt */}
              {showResumePrompt && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm">
                    <h3 className="text-lg font-semibold mb-2">Resume playback?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Pick up where you left off at {Math.floor(resumeTime / 60)}:{Math.floor(resumeTime % 60).toString().padStart(2, '0')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleResumeClick}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => setShowResumePrompt(false)}
                        className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                      >
                        Start Over
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                  <button onClick={handleSubscribe} className="ml-2 px-4 py-1.5 rounded-full flex items-center gap-2 text-sm transition-colors bg-card hover:opacity-90 hidden sm:flex">
                    <IoIosNotificationsOutline size={18} />
                    <span>{subscribed ? 'Subscribed' : 'Subscribe'}</span>
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
                </div>
              </div>

              {/* Description */}
              <div className="mt-4 p-4 rounded-lg glass-card">
                <p className="text-muted text-sm leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>

              {/* Edit Video (owner) */}
              <div className="mt-4">
                {video_Data?.user && JSON.parse(localStorage.getItem('user') || '{}')._id === video_Data.user._id && (
                  <div className="flex items-center gap-3">
                    {!isEditingVideo ? (
                      <button onClick={toggleEditVideo} className="px-4 py-2 accent-btn rounded-lg">Edit Video</button>
                    ) : (
                      <div className="w-full glass-card p-4 rounded-lg">
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full input-card p-2 rounded mb-2" />
                        <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full input-card p-2 rounded mb-2" rows={4} />
                        <div className="flex gap-2">
                          <button onClick={saveVideoEdits} className="px-4 py-2 accent-btn rounded">Save</button>
                          <button onClick={toggleEditVideo} className="px-4 py-2 border border-soft rounded">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Comments ({video_Data?.comments?.length || 0})</h3>

                {/* Comment box */}
                <div className="mb-4">
                  <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a public comment..." className="w-full input-card p-3 rounded mb-2" rows={3} />
                  <div className="flex justify-end">
                    <button onClick={postComment} className="px-4 py-2 accent-btn rounded">Post</button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {(video_Data?.comments || []).slice().reverse().map((c) => (
                    <div key={c._id} className="p-3 glass-card rounded">
                      <div className="flex items-start gap-3">
                        <img src={c.user?.profilePic || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover" alt="u" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{c.user?.channelName || c.user?.userName}</div>
                              <div className="text-xs text-muted">{formatDate(c.createdAt)}</div>
                            </div>
                            <div>
                              {JSON.parse(localStorage.getItem('user') || '{}')._id === c.user?._id && (
                                <button onClick={() => startEditComment(c)} className="text-sm text-blue-300">Edit</button>
                              )}
                            </div>
                          </div>
                          <div className="mt-2">
                            {editingCommentId === c._id ? (
                              <div>
                                <textarea value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} className="w-full input-card p-2 rounded mb-2" rows={3} />
                                <div className="flex gap-2 justify-end">
                                  <button onClick={saveEditComment} className="px-3 py-1 accent-btn rounded">Save</button>
                                  <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 border border-soft rounded">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted whitespace-pre-line">{c.text}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
