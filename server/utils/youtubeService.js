const axios = require('axios');

/**
 * YouTube Data API Service
 * Fetches public video metadata for history tracking
 * Requires YOUTUBE_API_KEY in .env
 */
class YouTubeService {
    constructor() {
        this.apiKey = process.env.YOUTUBE_API_KEY;
        this.baseUrl = 'https://www.googleapis.com/youtube/v3';
        
        if (!this.apiKey) {
            console.warn('⚠️ YOUTUBE_API_KEY not found in environment variables. YouTube history will not work.');
        }
    }

    /**
     * Fetch video metadata from YouTube Data API
     * @param {string} videoId - YouTube video ID
     * @returns {Promise<Object>} Video metadata
     */
    async getVideoMetadata(videoId) {
        if (!this.apiKey) {
            throw new Error('YouTube API key not configured');
        }

        try {
            const response = await axios.get(`${this.baseUrl}/videos`, {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    id: videoId,
                    key: this.apiKey
                },
                timeout: 5000 // 5 second timeout
            });

            if (!response.data.items || response.data.items.length === 0) {
                throw new Error('Video not found or unavailable');
            }

            const video = response.data.items[0];
            const snippet = video.snippet;
            const contentDetails = video.contentDetails;

            // Parse ISO 8601 duration (e.g., "PT4M13S" -> 253 seconds)
            const duration = this.parseDuration(contentDetails.duration);

            return {
                videoId: video.id,
                title: snippet.title,
                thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
                channelName: snippet.channelTitle,
                channelId: snippet.channelId,
                duration: duration,
                publishedAt: snippet.publishedAt,
                description: snippet.description?.substring(0, 200), // Truncate for storage
                viewCount: parseInt(video.statistics?.viewCount || 0)
            };
        } catch (error) {
            if (error.response?.status === 403) {
                throw new Error('YouTube API quota exceeded or invalid API key');
            } else if (error.response?.status === 404) {
                throw new Error('Video not found');
            }
            
            console.error('YouTube API Error:', error.message);
            throw new Error('Failed to fetch YouTube video metadata');
        }
    }

    /**
     * Parse ISO 8601 duration format to seconds
     * @param {string} duration - ISO 8601 duration (e.g., "PT4M13S", "PT1H2M10S")
     * @returns {number} Duration in seconds
     */
    parseDuration(duration) {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;

        const hours = parseInt(match[1] || 0);
        const minutes = parseInt(match[2] || 0);
        const seconds = parseInt(match[3] || 0);

        return hours * 3600 + minutes * 60 + seconds;
    }

    /**
     * Validate YouTube video ID format
     * @param {string} videoId - Video ID to validate
     * @returns {boolean} True if valid
     */
    isValidVideoId(videoId) {
        // YouTube video IDs are 11 characters long and alphanumeric with - and _
        return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
    }

    /**
     * Extract video ID from various YouTube URL formats
     * @param {string} url - YouTube URL
     * @returns {string|null} Video ID or null if invalid
     */
    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /^[a-zA-Z0-9_-]{11}$/ // Direct video ID
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1] || match[0];
        }

        return null;
    }
}

module.exports = new YouTubeService();
