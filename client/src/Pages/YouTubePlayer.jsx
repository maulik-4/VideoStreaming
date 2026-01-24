import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import historyTracker from '../utils/historyTracker';
import axiosInstance from '../utils/axiosConfig';
import { ToastContainer, toast } from 'react-toastify';

const YouTubePlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const wasHiddenRef = useRef(false);
  const playerRef = useRef(null);
  const trackingIntervalRef = useRef(null);
  
  const [videoMetadata, setVideoMetadata] = useState(null);
  const [resumeTime, setResumeTime] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Fetch video metadata on mount
  useEffect(() => {
    fetchVideoMetadata();
    loadResumeTime();
  }, [videoId]);

  const fetchVideoMetadata = async () => {
    try {
      const response = await axiosInstance.get(`/history/youtube/metadata/${videoId}`);
      if (response.data.success) {
        setVideoMetadata(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch YouTube metadata:', error);
      // Use fallback metadata
      setVideoMetadata({
        title: 'YouTube Video',
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        channelName: 'YouTube',
        duration: 0
      });
    }
  };

  const loadResumeTime = async () => {
    const history = await historyTracker.getVideoHistory(videoId, 'youtube');
    if (history && history.progress > 5 && history.watchPercentage < 95) {
      setResumeTime(history.progress);
      setShowResumePrompt(true);
    }
  };

  // Initialize YouTube IFrame API
  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };

    if (window.YT && window.YT.Player) {
      initializePlayer();
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      historyTracker.flush();
    };
  }, [videoId, resumeTime]);

  const initializePlayer = () => {
    if (!iframeRef.current) return;

    playerRef.current = new window.YT.Player(iframeRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        controls: 1,
        start: Math.floor(resumeTime)
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange
      }
    });
  };

  const onPlayerReady = (event) => {
    setIsReady(true);
  };

  const onPlayerStateChange = (event) => {
    // YT.PlayerState.PLAYING = 1
    if (event.data === window.YT.PlayerState.PLAYING) {
      startTracking();
    } else {
      stopTracking();
    }
  };

  const startTracking = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }

    // Track progress every 10 seconds while playing
    trackingIntervalRef.current = setInterval(() => {
      if (playerRef.current) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();

          // Use metadata if available, otherwise construct from videoId
          const trackingData = videoMetadata || {
            title: 'YouTube Video',
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            channelName: 'YouTube',
            duration: duration
          };

          console.log(`📺 Tracking YouTube: ${currentTime}s / ${duration}s`);
          
          historyTracker.trackProgress({
            videoId: videoId,
            platform: 'youtube',
            progress: currentTime,
            duration: duration,
            title: trackingData.title,
            thumbnail: trackingData.thumbnail,
            channelName: trackingData.channelName
          });
        } catch (error) {
          console.error('❌ Failed to track YouTube progress:', error);
        }
      }
    }, 10000); // Every 10 seconds
  };

  const stopTracking = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    
    // Save current position when stopping
    if (playerRef.current) {
      try {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        
        const trackingData = videoMetadata || {
          title: 'YouTube Video',
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          channelName: 'YouTube',
          duration: duration
        };

        console.log(`📺 Saving YouTube progress on stop: ${currentTime}s / ${duration}s`);
        
        historyTracker.trackProgress({
          videoId: videoId,
          platform: 'youtube',
          progress: currentTime,
          duration: duration,
          title: trackingData.title,
          thumbnail: trackingData.thumbnail,
          channelName: trackingData.channelName
        });
      } catch (error) {
        console.error('❌ Failed to save YouTube progress:', error);
      }
    }
  };

  const handleResumeClick = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(resumeTime, true);
      playerRef.current.playVideo();
    }
    setShowResumePrompt(false);
  };

  // Resume playback when tab regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHiddenRef.current = true;
        stopTracking();
      } else if (wasHiddenRef.current && playerRef.current) {
        wasHiddenRef.current = false;
        try {
          playerRef.current.playVideo();
        } catch (error) {
          console.error('Failed to resume playback:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount - save progress immediately
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('🚪 Unmounting YouTubePlayer, saving history...');
      
      // Save current progress immediately before leaving
      if (playerRef.current) {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          
          if (currentTime > 5) {
            const trackingData = videoMetadata || {
              title: 'YouTube Video',
              thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              channelName: 'YouTube',
              duration: duration
            };

            historyTracker.trackProgress({
              videoId: videoId,
              platform: 'youtube',
              progress: currentTime,
              duration: duration,
              title: trackingData.title,
              thumbnail: trackingData.thumbnail,
              channelName: trackingData.channelName
            });
            
            // Force immediate save
            historyTracker.DEBOUNCE_TIME = 0;
            historyTracker.saveNow();
            historyTracker.DEBOUNCE_TIME = 5000; // Reset debounce
          }
        } catch (error) {
          console.error('Failed to save on unmount:', error);
        }
      }
    };
  }, [videoId, videoMetadata]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <ToastContainer />
      
      <div className="w-full max-w-xs sm:max-w-md md:max-w-3xl lg:max-w-5xl aspect-video glass-card rounded-lg sm:rounded-xl overflow-hidden shadow-lg relative">
        <div ref={iframeRef} id="youtube-player" className="w-full h-full"></div>
        
        {/* Resume playback prompt */}
        {showResumePrompt && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm mx-4">
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
      
      <div className="mt-3 sm:mt-4 md:mt-6 flex flex-col xs:flex-row gap-2 xs:gap-3 w-full max-w-xs sm:max-w-md md:max-w-3xl lg:max-w-5xl">
        <button 
          className="accent-btn px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm sm:text-base font-medium transition-opacity hover:opacity-90 flex-1 xs:flex-none"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <button 
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded text-sm sm:text-base font-medium border border-soft transition-opacity hover:opacity-90 flex-1 xs:flex-none"
          onClick={() => navigate('/')}
        >
          🏠 Home
        </button>
      </div>
      <p className="text-muted text-xs sm:text-sm mt-4 text-center max-w-md">
        💡 Your watch progress is automatically saved
      </p>
    </div>
  );
};

export default YouTubePlayer;
