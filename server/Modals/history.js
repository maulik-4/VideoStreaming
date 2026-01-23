const mongoose = require('mongoose');

/**
 * Watch History Schema
 * Supports both local platform videos and YouTube videos
 * Prevents duplicates using compound unique index
 * Tracks watch progress and timestamps
 */
const historySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Index for faster user queries
    },
    
    // Platform type: "local" for our videos, "youtube" for YouTube videos
    platform: {
        type: String,
        enum: ['local', 'youtube'],
        required: true,
        default: 'local'
    },
    
    // Video identifier (MongoDB ObjectId for local, YouTube video ID for youtube)
    videoId: {
        type: String,
        required: true
    },
    
    // Video metadata (cached for performance)
    title: {
        type: String,
        required: true
    },
    
    thumbnail: {
        type: String,
        required: true
    },
    
    channelName: {
        type: String,
        required: true
    },
    
    // For local videos, store reference to user who uploaded
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Watch progress in seconds
    progress: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Video duration in seconds (for resume functionality)
    duration: {
        type: Number,
        default: 0
    },
    
    // First time video was watched
    firstWatchedAt: {
        type: Date,
        default: Date.now
    },
    
    // Last time video was watched (updated on rewatch)
    watchedAt: {
        type: Date,
        default: Date.now,
        index: true // Index for sorting by recent
    },
    
    // Track if video was completed (watched > 90%)
    completed: {
        type: Boolean,
        default: false
    },
    
    // Number of times rewatched
    watchCount: {
        type: Number,
        default: 1,
        min: 1
    }
}, { 
    timestamps: true,
    // Automatically remove documents older than 90 days (optional)
    // expireAfterSeconds can be added via index if needed
});

// Compound unique index to prevent duplicate history entries
// Each user can have only one history entry per video
historySchema.index({ user: 1, videoId: 1, platform: 1 }, { unique: true });

// Index for efficient sorting and pagination
historySchema.index({ user: 1, watchedAt: -1 });

// Virtual for calculating watch percentage
historySchema.virtual('watchPercentage').get(function() {
    if (this.duration <= 0) return 0;
    return Math.min(100, Math.round((this.progress / this.duration) * 100));
});

// Method to check if video should be marked as completed
historySchema.methods.updateCompletionStatus = function() {
    if (this.duration > 0 && this.progress >= this.duration * 0.9) {
        this.completed = true;
    }
    return this.completed;
};

// Static method to clean old history (keep only latest 100 per user)
historySchema.statics.cleanOldHistory = async function(userId, limit = 100) {
    const historyToDelete = await this.find({ user: userId })
        .sort({ watchedAt: -1 })
        .skip(limit)
        .select('_id');
    
    if (historyToDelete.length > 0) {
        const idsToDelete = historyToDelete.map(h => h._id);
        await this.deleteMany({ _id: { $in: idsToDelete } });
        return idsToDelete.length;
    }
    return 0;
};

module.exports = mongoose.model('History', historySchema);
