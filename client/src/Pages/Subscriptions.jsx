import React, { useEffect, useState } from 'react';
import Sidebar from '../Components/Sidebar/Sidebar';
import axiosInstance from '../utils/axiosConfig';
import VideoCard from '../Components/VideoCard';
import { useNavigate } from 'react-router-dom';

const Subscriptions = ({ SideBar }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axiosInstance.get('/auth/subscriptions/videos')
      .then(res => {
        setVideos(res.data.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const navigate = useNavigate();

  return (
    <div className="flex -mt-[8vh] relative min-h-screen" style={{background:'var(--bg)', color:'var(--text)'}}>
      <Sidebar SideBar={SideBar} />
      <div className="flex flex-col w-full overflow-x-hidden p-6">
        <h1 className="text-2xl font-bold mb-4">Your Subscriptions</h1>
        {loading ? (
          <div className="text-muted">Loading...</div>
        ) : videos.length === 0 ? (
          <div className="glass-card p-6 rounded">No videos from your subscriptions yet.</div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map(v => <VideoCard key={v._1d || v._id} video={v} navigate={navigate} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;
