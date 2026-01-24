const History = require('../Modals/history');
const Video = require('../Modals/video');
const youtubeService = require('../utils/youtubeService');

/**
 * History Controller
 * Manages watch history for both local and YouTube videos
 */

/**
 * Save or update watch history
 * POST /history
 * Body: { videoId, platform, progress, duration, title?, thumbnail?, channelName? }
 */
const saveHistory = async (req, res) => {
    try {
        console.log('📝 saveHistory called');
        console.log('🔐 req.user:', req.user);
        
        const userId = req.user._id; // From authentication middleware
        const { videoId, platform, progress, duration, title, thumbnail, channelName } = req.body;

        console.log('📊 Received data:', { videoId, platform, progress, duration });

        // Validation
        if (!videoId || !platform) {
            console.warn('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'videoId and platform are required'
            });
        }

        if (!['local', 'youtube'].includes(platform)) {
            console.warn('❌ Invalid platform:', platform);
            return res.status(400).json({
                success: false,
                message: 'platform must be "local" or "youtube"'
            });
        }

        // Minimum watch time threshold (5 seconds)
        const MIN_WATCH_TIME = 5;
        if (progress < MIN_WATCH_TIME) {
            console.log('⏱️  Video watched < 5 seconds, skipping save');
            return res.status(200).json({
                success: true,
                message: 'Video watched for less than 5 seconds, not saved to history'
            });
        }

        let videoData = {};

        // Fetch metadata based on platform
        if (platform === 'local') {
            console.log('🎬 Fetching local video metadata for:', videoId);
            // For local videos, fetch from database
            const video = await Video.findById(videoId).populate('user', 'channelName profilePic');
            
            if (!video) {
                console.error('❌ Local video not found:', videoId);
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            videoData = {
                title: video.title,
                thumbnail: video.thumbnail,
                channelName: video.user?.channelName || 'Unknown',
                uploadedBy: video.user?._id,
                duration: duration || 0
            };
            console.log('✅ Local video metadata fetched');
        } else {
            // For YouTube videos, use provided data or fetch from API
            console.log('📺 Processing YouTube video:', videoId);
            if (title && thumbnail && channelName) {
                console.log('✅ Using provided YouTube metadata');
                videoData = { title, thumbnail, channelName, duration: duration || 0 };
            } else {
                // Fallback: fetch from YouTube API
                try {
                    console.log('🔗 Fetching from YouTube API...');
                    const ytMetadata = await youtubeService.getVideoMetadata(videoId);
                    videoData = {
                        title: ytMetadata.title,
                        thumbnail: ytMetadata.thumbnail,
                        channelName: ytMetadata.channelName,
                        duration: ytMetadata.duration
                    };
                    console.log('✅ YouTube metadata fetched from API');
                } catch (error) {
                    console.warn('⚠️ YouTube API failed, using fallback');
                    // If YouTube API fails, use provided data or defaults
                    videoData = {
                        title: title || 'YouTube Video',
                        thumbnail: thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                        channelName: channelName || 'Unknown',
                        duration: duration || 0
                    };
                }
            }
        }

        console.log('💾 Upserting history entry...');
        // Upsert history (update if exists, create if not)
        const historyEntry = await History.findOneAndUpdate(
            { user: userId, videoId, platform },
            {
                $set: {
                    ...videoData,
                    progress: progress || 0,
                    watchedAt: new Date() // Update to current time on rewatch
                },
                $inc: { watchCount: 1 }, // Increment watch count
                $setOnInsert: { firstWatchedAt: new Date() } // Only set on first insert
            },
            { 
                upsert: true, 
                new: true,
                runValidators: true
            }
        );

        console.log('✅ History entry saved/updated:', historyEntry._id);

        // Update completion status
        historyEntry.updateCompletionStatus();
        await historyEntry.save();

        // Clean old history (keep only latest 100)
        await History.cleanOldHistory(userId, 100);

        console.log('🎉 History saved successfully');
        res.status(200).json({
            success: true,
            message: 'History saved successfully',
            data: historyEntry
        });

    } catch (error) {
        console.error('❌ Save history error:', error);
        
        // Handle duplicate key error (race condition)
        if (error.code === 11000) {
            console.error('🔑 Duplicate key error');
            return res.status(409).json({
                success: false,
                message: 'History entry already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to save history',
            error: error.message
        });
    }
};

/**
 * Get user's watch history
 * GET /history
 * Query params: page, limit, platform (optional filter)
 */
const getHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const platformFilter = req.query.platform; // Optional: 'local' or 'youtube'
        
        // Validate limit
        const maxLimit = 100;
        const validLimit = Math.min(limit, maxLimit);
        const skip = (page - 1) * validLimit;

        // Build query
        const query = { user: userId };
        if (platformFilter && ['local', 'youtube'].includes(platformFilter)) {
            query.platform = platformFilter;
        }

        // Fetch history with pagination
        const [history, totalCount] = await Promise.all([
            History.find(query)
                .sort({ watchedAt: -1 }) // Most recent first
                .skip(skip)
                .limit(validLimit)
                .populate('uploadedBy', 'channelName profilePic')
                .lean(), // Use lean for better performance
            History.countDocuments(query)
        ]);

        // Add computed fields
        const historyWithMeta = history.map(item => ({
            ...item,
            watchPercentage: item.duration > 0 
                ? Math.min(100, Math.round((item.progress / item.duration) * 100))
                : 0
        }));

        res.status(200).json({
            success: true,
            data: historyWithMeta,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / validLimit),
                totalItems: totalCount,
                itemsPerPage: validLimit,
                hasMore: skip + history.length < totalCount
            }
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch history',
            error: error.message
        });
    }
};

/**
 * Get watch analytics for the authenticated user
 * GET /history/analytics
 */
const getHistoryAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;

        const analytics = await History.aggregate([
            { $match: { user: userId } },
            {
                $addFields: {
                    progressSafe: {
                        $convert: { input: "$progress", to: "double", onError: 0, onNull: 0 }
                    },
                    durationSafe: {
                        $convert: { input: "$duration", to: "double", onError: 0, onNull: 0 }
                    },
                    watchedAtSafe: { $ifNull: ["$watchedAt", "$createdAt"] },
                    // Cap watchTime at duration when available to avoid over-counting
                    watchTime: {
                        $cond: [
                            { $gt: ["$durationSafe", 0] },
                            { $min: ["$progressSafe", "$durationSafe"] },
                            "$progressSafe"
                        ]
                    },
                    // Safely convert to ObjectId only when platform is local and string is valid
                    videoObjectId: {
                        $cond: [
                            { $eq: ["$platform", "local"] },
                            {
                                $convert: {
                                    input: "$videoId",
                                    to: "objectId",
                                    onError: null,
                                    onNull: null
                                }
                            },
                            null
                        ]
                    },
                    language: {
                        // Heuristic: detect Devanagari characters; fall back to English/Other
                        $cond: [
                            {
                                $regexMatch: {
                                    input: "$title",
                                    // Inline Devanagari range to avoid PCRE2 escape issues
                                    regex: "[ऀ-ॿ]"
                                }
                            },
                            "Hindi / Regional",
                            "English / Other"
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: 'videos',
                    localField: 'videoObjectId',
                    foreignField: '_id',
                    as: 'videoMeta'
                }
            },
            {
                $addFields: {
                    category: {
                        $cond: [
                            { $eq: ["$platform", "local"] },
                            { $ifNull: [{ $arrayElemAt: ["$videoMeta.category", 0] }, "Unknown"] },
                            "YouTube"
                        ]
                    },
                    durationBucket: {
                        $switch: {
                            branches: [
                                { case: { $lte: ["$durationSafe", 300] }, then: "Short (<5 min)" },
                                { case: { $and: [ { $gt: ["$durationSafe", 300] }, { $lte: ["$durationSafe", 1200] } ] }, then: "Medium (5-20 min)" },
                                { case: { $gt: ["$durationSafe", 1200] }, then: "Long (>20 min)" }
                            ],
                            default: "Unknown"
                        }
                    }
                }
            },
            {
                $project: {
                    videoMeta: 0,
                    videoObjectId: 0
                }
            },
            {
                $facet: {
                    totals: [
                        {
                            $group: {
                                _id: null,
                                totalWatchTime: { $sum: "$watchTime" },
                                totalEntries: { $sum: 1 },
                                completedCount: { $sum: { $cond: ["$completed", 1, 0] } },
                                averageWatchTime: { $avg: "$watchTime" }
                            }
                        }
                    ],
                    platformBreakdown: [
                        { $group: { _id: "$platform", watchTime: { $sum: "$watchTime" }, count: { $sum: 1 } } },
                        { $sort: { watchTime: -1 } }
                    ],
                    perVideo: [
                        {
                            $group: {
                                _id: {
                                    videoId: "$videoId",
                                    platform: "$platform",
                                    title: "$title",
                                    thumbnail: "$thumbnail",
                                    channelName: "$channelName"
                                },
                                watchTime: { $sum: "$watchTime" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { watchTime: -1 } },
                        { $limit: 20 }
                    ],
                    perCategory: [
                        { $group: { _id: "$category", watchTime: { $sum: "$watchTime" }, count: { $sum: 1 } } },
                        { $sort: { watchTime: -1 } },
                        { $limit: 20 }
                    ],
                    perChannel: [
                        { $group: { _id: "$channelName", watchTime: { $sum: "$watchTime" }, count: { $sum: 1 } } },
                        { $sort: { watchTime: -1 } },
                        { $limit: 20 }
                    ],
                    durationBuckets: [
                        { $group: { _id: "$durationBucket", watchTime: { $sum: "$watchTime" }, count: { $sum: 1 } } },
                        { $sort: { watchTime: -1 } }
                    ],
                    languageBreakdown: [
                        { $group: { _id: "$language", watchTime: { $sum: "$watchTime" }, count: { $sum: 1 } } },
                        { $sort: { watchTime: -1 } }
                    ],
                    daily: [
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$watchedAtSafe" } },
                                watchTime: { $sum: "$watchTime" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } },
                        { $limit: 30 }
                    ],
                    weekly: [
                        {
                            $group: {
                                _id: {
                                    year: { $isoWeekYear: "$watchedAtSafe" },
                                    week: { $isoWeek: "$watchedAtSafe" }
                                },
                                watchTime: { $sum: "$watchTime" },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { "_id.year": 1, "_id.week": 1 } },
                        { $limit: 12 }
                    ],
                    peakHours: [
                        { $group: { _id: { $hour: "$watchedAtSafe" }, watchTime: { $sum: "$watchTime" }, count: { $sum: 1 } } },
                        { $sort: { watchTime: -1 } },
                        { $limit: 24 }
                    ]
                }
            }
        ]);

        const result = analytics[0] || {};
        const totals = (result.totals && result.totals[0]) || {
            totalWatchTime: 0,
            totalEntries: 0,
            completedCount: 0,
            averageWatchTime: 0
        };

        res.status(200).json({
            success: true,
            data: {
                totals,
                platformBreakdown: result.platformBreakdown || [],
                perVideo: result.perVideo || [],
                perCategory: result.perCategory || [],
                perChannel: result.perChannel || [],
                durationBuckets: result.durationBuckets || [],
                languageBreakdown: result.languageBreakdown || [],
                daily: result.daily || [],
                weekly: result.weekly || [],
                peakHours: result.peakHours || []
            }
        });
    } catch (error) {
        console.error('Get history analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
            error: error.message
        });
    }
};

/**
 * Delete all watch history for a user
 * DELETE /history
 */
const clearHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        const result = await History.deleteMany({ user: userId });

        res.status(200).json({
            success: true,
            message: 'History cleared successfully',
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear history',
            error: error.message
        });
    }
};

/**
 * Delete a single history item
 * DELETE /history/:videoId
 * Query param: platform (required)
 */
const deleteHistoryItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { videoId } = req.params;
        const { platform } = req.query;

        if (!platform || !['local', 'youtube'].includes(platform)) {
            return res.status(400).json({
                success: false,
                message: 'Valid platform query parameter is required (local or youtube)'
            });
        }

        const result = await History.findOneAndDelete({
            user: userId,
            videoId,
            platform
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'History item not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'History item deleted successfully',
            data: result
        });

    } catch (error) {
        console.error('Delete history item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete history item',
            error: error.message
        });
    }
};

/**
 * Get history entry for a specific video (for resume playback)
 * GET /history/video/:videoId
 * Query param: platform (required)
 */
const getHistoryItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const { videoId } = req.params;
        const { platform } = req.query;

        if (!platform || !['local', 'youtube'].includes(platform)) {
            return res.status(400).json({
                success: false,
                message: 'Valid platform query parameter is required (local or youtube)'
            });
        }

        const historyItem = await History.findOne({
            user: userId,
            videoId,
            platform
        }).populate('uploadedBy', 'channelName profilePic');

        if (!historyItem) {
            return res.status(404).json({
                success: false,
                message: 'No history found for this video'
            });
        }

        res.status(200).json({
            success: true,
            data: historyItem
        });

    } catch (error) {
        console.error('Get history item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch history item',
            error: error.message
        });
    }
};

/**
 * Fetch YouTube video metadata (public endpoint for client-side use)
 * GET /history/youtube/metadata/:videoId
 */
const getYouTubeMetadata = async (req, res) => {
    try {
        const { videoId } = req.params;

        if (!youtubeService.isValidVideoId(videoId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid YouTube video ID'
            });
        }

        const metadata = await youtubeService.getVideoMetadata(videoId);

        res.status(200).json({
            success: true,
            data: metadata
        });

    } catch (error) {
        console.error('YouTube metadata error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch YouTube metadata'
        });
    }
};

module.exports = {
    saveHistory,
    getHistory,
    getHistoryAnalytics,
    clearHistory,
    deleteHistoryItem,
    getHistoryItem,
    getYouTubeMetadata
};
