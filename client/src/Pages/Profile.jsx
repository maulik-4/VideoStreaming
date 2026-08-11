import React, { useEffect, useState } from 'react';
import Sidebar from '../Components/Sidebar/Sidebar';
import axios from 'axios';
import axiosInstance from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';

const Profile = ({ SideBar }) => {
  const [userVideos, setUserVideos] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Safely get user from localStorage
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const role = user?.role;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get(`/api/${id}/getAllVideosById`);
        setUserVideos(res.data.data || []);
      } catch (error) {
        
      }
    };

    fetchUser();
  }, [id]);

 

  const userInfo = userVideos.length > 0 ? userVideos[0].user : null;

  return (
    <div className="flex w-full min-h-screen flex-col md:flex-row" style={{background:'var(--bg)', color:'var(--text)'}}>
      {SideBar && <Sidebar SideBar={SideBar} />}

      <div className="flex flex-col w-full px-6 md:px-12 py-8">
        {/* User Info */}
        {userInfo && (
          <div className="user_info flex items-center gap-4 glass-card p-6 rounded-xl shadow-lg" style={{border:'1px solid rgba(255,255,255,0.03)'}}>
            <img
              src={userInfo.profilePic}
              className="w-20 h-20 rounded-full object-cover"
              alt={userInfo.userName}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150';
              }}
            />
            <div className="info text-lg">
              <h1 className="font-bold text-xl md:text-2xl">{userInfo.userName}</h1>
              <h1 className="text-muted text-lg md:text-xl">@{userInfo.channelName}</h1>
              {userInfo.role === 'admin' && (
                <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full mt-2 inline-block">Admin</span>
              )}
            </div>
          </div>
        )}

        {/* Videos Section */}
        <h1 className="text-2xl font-bold mt-6 mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Videos</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {userVideos.length > 0 ? (
            userVideos.map((video, index) => (
              <div
                key={index}
                className="video_card p-4 rounded-xl shadow-lg transition-all duration-300 glass-card"
              >
                <div onClick={() => navigate(`/watch/${video.id}`)} className="cursor-pointer">
                  <div
                    className="video_thumbnail w-full h-40 rounded-lg mb-3 overflow-hidden"
                    style={{
                      backgroundImage: `url(${video.thumbnail})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  ></div>
                  <h1 className="text-lg font-semibold line-clamp-1">{video.title}</h1>
                  <h1 className="text-muted text-sm">{video.user.userName}</h1>
                  <div className="flex justify-between text-muted text-sm mt-2">
                    <span>👁️ {video.views || 0}</span>
                    <span>❤️ {video.likes || 0}</span>
                  </div>
                </div>

                {user && user.id === video.user.id && (
                  <div className="mt-3 flex gap-2">
                    <button
                      className="px-3 py-1 border border-soft rounded"
                      onClick={() => {
                        setEditingId(video.id);
                        setEditTitle(video.title || '');
                        setEditDescription(video.description || '');
                        setEditCategory(video.category || '');
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 accent-btn rounded"
                      onClick={() => navigate(`/watch/${video.id}`)}
                    >
                      Open
                    </button>
                  </div>
                )}

                {editingId === video.id && (
                  <div className="mt-3 glass-card p-3 rounded space-y-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full input-card p-2 rounded"
                      placeholder="Title"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full input-card p-2 rounded"
                      rows={3}
                      placeholder="Description"
                    />
                    <input
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full input-card p-2 rounded"
                      placeholder="Category"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        className="px-3 py-1 accent-btn rounded"
                        onClick={async () => {
                          try {
                            await axiosInstance.put(`/api/${video.id}`, {
                              title: editTitle,
                              description: editDescription,
                              category: editCategory,
                            });
                            toast.success('Video updated');
                            setEditingId(null);
                            const res = await axiosInstance.get(`/api/${id}/getAllVideosById`);
                            setUserVideos(res.data.data || []);
                          } catch (err) {
                            
                            toast.error('Failed to update video');
                          }
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="px-3 py-1 border border-soft rounded"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 text-muted mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No videos found</h3>
              <p className="text-muted max-w-md">This channel hasn't uploaded any videos yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
