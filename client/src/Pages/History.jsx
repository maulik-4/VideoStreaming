import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import { ToastContainer, toast } from 'react-toastify';
import Sidebar from '../Components/Sidebar/Sidebar';
import { MdDelete, MdHistory } from 'react-icons/md';
import { AiFillYoutube } from 'react-icons/ai';
import { BsPlayCircle } from 'react-icons/bs';
import Loader from '../Components/Loader';

const History = ({ SideBar }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [platformFilter, setPlatformFilter] = useState(''); // '', 'local', or 'youtube'
  const navigate = useNavigate();

  // Fetch history on mount and when filters change
  useEffect(() => {
    fetchHistory();
  }, [page, platformFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const params = {
        page,
        limit: 20
      };

      if (platformFilter) {
        params.platform = platformFilter;
      }

      const response = await axiosInstance.get('/history', { params });
      
      if (response.data.success) {
        setHistory(response.data.data);
        setHasMore(response.data.pagination.hasMore);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to view history');
        navigate('/login');
      } else {
        toast.error('Failed to load watch history');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (item) => {
    if (item.platform === 'local') {
      navigate(`/watch/${item.videoId}`);
    } else {
      navigate(`/youtube/${item.videoId}`);
    }
  };

  const deleteHistoryItem = async (videoId, platform, e) => {
    e.stopPropagation();
    
    try {
      const response = await axiosInstance.delete(`/history/${videoId}`, {
        params: { platform }
      });
      
      if (response.data.success) {
        toast.success('Removed from history');
        setHistory(prev => prev.filter(item => 
          !(item.videoId === videoId && item.platform === platform)
        ));
      }
    } catch (error) {
      console.error('Failed to delete history item:', error);
      toast.error('Failed to remove from history');
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all watch history? This cannot be undone.')) {
      return;
    }

    try {
      const response = await axiosInstance.delete('/history');
      
      if (response.data.success) {
        toast.success('History cleared successfully');
        setHistory([]);
        setPage(1);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error('Failed to clear history');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    const now = new Date();
    const watched = new Date(date);
    const diffTime = Math.abs(now - watched);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return watched.toLocaleDateString();
    }
  };

  if (loading && page === 1) {
    return <Loader />;
  }

  return (
    <div className="flex" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <ToastContainer />
      {SideBar && <Sidebar />}
      
      <div className="flex-1 p-4 md:p-6" style={{ marginLeft: SideBar ? '240px' : '0' }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MdHistory className="text-3xl" style={{ color: 'var(--accent)' }} />
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text)' }}>
                Watch History
              </h1>
            </div>
            
            {history.length > 0 && (
              <button
                onClick={clearAllHistory}
                className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
                style={{ 
                  background: 'var(--error)', 
                  color: 'white' 
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setPlatformFilter(''); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                platformFilter === '' ? 'opacity-100' : 'opacity-60'
              }`}
              style={{ 
                background: platformFilter === '' ? 'var(--accent)' : 'var(--card-bg)',
                color: platformFilter === '' ? 'white' : 'var(--text)'
              }}
            >
              All
            </button>
            <button
              onClick={() => { setPlatformFilter('local'); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                platformFilter === 'local' ? 'opacity-100' : 'opacity-60'
              }`}
              style={{ 
                background: platformFilter === 'local' ? 'var(--accent)' : 'var(--card-bg)',
                color: platformFilter === 'local' ? 'white' : 'var(--text)'
              }}
            >
              My Platform
            </button>
            <button
              onClick={() => { setPlatformFilter('youtube'); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                platformFilter === 'youtube' ? 'opacity-100' : 'opacity-60'
              }`}
              style={{ 
                background: platformFilter === 'youtube' ? 'var(--accent)' : 'var(--card-bg)',
                color: platformFilter === 'youtube' ? 'white' : 'var(--text)'
              }}
            >
              <AiFillYoutube /> YouTube
            </button>
          </div>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div className="text-center py-20">
            <MdHistory className="text-6xl mx-auto mb-4 opacity-30" />
            <p className="text-xl opacity-70">No watch history yet</p>
            <p className="text-sm opacity-50 mt-2">Videos you watch will appear here</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {history.map((item) => (
                <div
                  key={`${item.platform}-${item.videoId}`}
                  onClick={() => handleVideoClick(item)}
                  className="flex gap-4 p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ background: 'var(--card-bg)' }}
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0 w-40 md:w-48 aspect-video rounded overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Platform badge */}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold"
                      style={{ 
                        background: item.platform === 'youtube' ? '#FF0000' : 'var(--accent)',
                        color: 'white'
                      }}
                    >
                      {item.platform === 'youtube' ? 'YouTube' : 'Local'}
                    </div>

                    {/* Progress bar */}
                    {item.watchPercentage > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-50">
                        <div
                          className="h-full"
                          style={{ 
                            width: `${item.watchPercentage}%`,
                            background: 'var(--accent)'
                          }}
                        />
                      </div>
                    )}

                    {/* Duration */}
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-semibold bg-black bg-opacity-80 text-white">
                      {formatDuration(item.duration)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold mb-1 line-clamp-2"
                      style={{ color: 'var(--text)' }}
                    >
                      {item.title}
                    </h3>
                    
                    <p className="text-sm mb-2 opacity-70">
                      {item.channelName}
                    </p>

                    <div className="flex items-center gap-3 text-xs opacity-60 mb-2">
                      <span>{formatDate(item.watchedAt)}</span>
                      {item.watchCount > 1 && (
                        <span>• Watched {item.watchCount}x</span>
                      )}
                      {item.watchPercentage > 0 && (
                        <span>• {item.watchPercentage}% watched</span>
                      )}
                    </div>

                    {/* Resume button */}
                    {item.watchPercentage > 5 && item.watchPercentage < 95 && (
                      <div className="flex items-center gap-2 text-sm">
                        <BsPlayCircle style={{ color: 'var(--accent)' }} />
                        <span style={{ color: 'var(--accent)' }}>
                          Resume at {formatDuration(item.progress)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => deleteHistoryItem(item.videoId, item.platform, e)}
                    className="p-2 rounded-lg hover:bg-opacity-80 transition-all flex-shrink-0"
                    style={{ background: 'var(--error)' }}
                  >
                    <MdDelete className="text-xl text-white" />
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-30"
                  style={{ background: 'var(--card-bg)', color: 'var(--text)' }}
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 flex items-center">
                  Page {page} of {totalPages}
                </span>
                
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore}
                  className="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-30"
                  style={{ background: 'var(--card-bg)', color: 'var(--text)' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default History;
