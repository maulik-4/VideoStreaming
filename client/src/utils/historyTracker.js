import axiosInstance from './axiosConfig';

/**
 * History Tracker Utility
 * Manages watch history for both local and YouTube videos
 */

class HistoryTracker {
  constructor() {
    this.updateQueue = new Map(); // videoId -> timeout
    this.DEBOUNCE_TIME = 5000; // 5 seconds
    this.MIN_WATCH_TIME = 5; // Minimum 5 seconds before saving
    this.UPDATE_INTERVAL = 30000; // Update progress every 30 seconds
  }

  /**
   * Track video watch progress
   * @param {Object} params - Video details
   * @param {string} params.videoId - Video identifier
   * @param {string} params.platform - 'local' or 'youtube'
   * @param {number} params.progress - Current playback position in seconds
   * @param {number} params.duration - Total video duration in seconds
   * @param {string} params.title - Video title
   * @param {string} params.thumbnail - Video thumbnail URL
   * @param {string} params.channelName - Channel/creator name
   */
  async trackProgress({ videoId, platform, progress, duration, title, thumbnail, channelName }) {
    // Don't save if watched less than minimum time
    if (progress < this.MIN_WATCH_TIME) {
      console.log(`⏱️  Progress ${progress}s < MIN_WATCH_TIME ${this.MIN_WATCH_TIME}s, not saving`);
      return;
    }

    // Don't save if user is not logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️  No token found, history not saved');
      return;
    }

    // Debounce to avoid excessive API calls
    const key = `${platform}-${videoId}`;
    
    console.log(`📝 Tracking ${platform} video ${videoId}: progress=${progress}s, duration=${duration}s`);
    
    if (this.updateQueue.has(key)) {
      console.log(`⏱️  Debounce: clearing previous timeout for ${key}`);
      clearTimeout(this.updateQueue.get(key));
    }

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`📤 Posting history for ${platform}/${videoId}`);
        const response = await axiosInstance.post('/history', {
          videoId,
          platform,
          progress: Math.floor(progress),
          duration: Math.floor(duration),
          title,
          thumbnail,
          channelName
        });
        
        console.log('✅ History saved:', response.data);
        this.updateQueue.delete(key);
      } catch (error) {
        console.error('❌ Failed to save history:', error.response?.data || error.message);
        // Silently fail - don't disrupt user experience
      }
    }, this.DEBOUNCE_TIME);

    this.updateQueue.set(key, timeoutId);
  }

  /**
   * Start tracking for a local video
   * @param {string} videoId - MongoDB video ID
   * @param {Object} videoData - Video metadata
   */
  trackLocalVideo(videoId, videoData) {
    const { title, thumbnail, user } = videoData;
    
    return {
      update: (progress, duration) => {
        this.trackProgress({
          videoId,
          platform: 'local',
          progress,
          duration,
          title,
          thumbnail,
          channelName: user?.channelName || 'Unknown'
        });
      }
    };
  }

  /**
   * Start tracking for a YouTube video
   * @param {string} videoId - YouTube video ID
   * @param {Object} videoData - Video metadata
   */
  trackYouTubeVideo(videoId, videoData) {
    return {
      update: (progress, duration) => {
        this.trackProgress({
          videoId,
          platform: 'youtube',
          progress,
          duration,
          title: videoData.title,
          thumbnail: videoData.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          channelName: videoData.channelName || 'YouTube'
        });
      }
    };
  }

  /**
   * Get history for a specific video (for resume functionality)
   * @param {string} videoId - Video ID
   * @param {string} platform - 'local' or 'youtube'
   * @returns {Promise<Object|null>} History data or null
   */
  async getVideoHistory(videoId, platform) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await axiosInstance.get(`/history/video/${videoId}`, {
        params: { platform }
      });

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch video history:', error);
      }
      return null;
    }
  }

  /**
   * Save all pending updates immediately (for unmount/navigation)
   */
  async saveNow() {
    console.log('💾 Saving all pending history now...');
    const pendingKeys = Array.from(this.updateQueue.keys());
    
    for (const key of pendingKeys) {
      const timeoutId = this.updateQueue.get(key);
      clearTimeout(timeoutId);
      this.updateQueue.delete(key);
    }
    
    console.log(`✅ Processed ${pendingKeys.length} pending updates`);
  }

  /**
   * Flush pending updates immediately (call when user navigates away)
   */
  flush() {
    console.log('💾 Flushing pending history updates...');
    this.updateQueue.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.updateQueue.clear();
    console.log('✅ Queue cleared');
  }

  /**
   * Setup periodic progress updates
   * @param {Function} getCurrentTime - Function that returns current playback time
   * @param {Function} getDuration - Function that returns video duration
   * @param {Object} videoInfo - Video metadata
   * @returns {Function} Cleanup function
   */
  setupPeriodicTracking(getCurrentTime, getDuration, videoInfo) {
    const intervalId = setInterval(() => {
      const currentTime = getCurrentTime();
      const duration = getDuration();
      
      if (currentTime > this.MIN_WATCH_TIME) {
        this.trackProgress({
          ...videoInfo,
          progress: currentTime,
          duration
        });
      }
    }, this.UPDATE_INTERVAL);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      this.flush();
    };
  }
}

// Singleton instance
const historyTracker = new HistoryTracker();

export default historyTracker;


/**
 * React Hook for tracking video history
 * Usage example:
 * 
 * const { trackProgress, resumeTime } = useHistoryTracking({
 *   videoId: '123',
 *   platform: 'local',
 *   title: 'My Video',
 *   thumbnail: 'https://...',
 *   channelName: 'Channel'
 * });
 * 
 * // In your video player's onTimeUpdate:
 * trackProgress(currentTime, duration);
 */
export const useHistoryTracking = ({ videoId, platform, title, thumbnail, channelName }) => {
  const [resumeTime, setResumeTime] = React.useState(0);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    // Load resume time on mount
    const loadResumeTime = async () => {
      const history = await historyTracker.getVideoHistory(videoId, platform);
      if (history && history.progress > 5 && history.watchPercentage < 95) {
        setResumeTime(history.progress);
      }
      setHasLoaded(true);
    };

    loadResumeTime();

    // Cleanup on unmount
    return () => {
      historyTracker.flush();
    };
  }, [videoId, platform]);

  const trackProgress = React.useCallback((progress, duration) => {
    historyTracker.trackProgress({
      videoId,
      platform,
      progress,
      duration,
      title,
      thumbnail,
      channelName
    });
  }, [videoId, platform, title, thumbnail, channelName]);

  return {
    trackProgress,
    resumeTime,
    hasLoaded,
    shouldResume: resumeTime > 5
  };
};
