const express = require('express');
const router = express.Router();
const {
    saveHistory,
    getHistory,
    getHistoryAnalytics,
    clearHistory,
    deleteHistoryItem,
    getHistoryItem,
    getYouTubeMetadata
} = require('../Controllers/history');
const authMiddleware = require('../middlewares/authentication');

/**
 * History Routes
 * All routes require authentication
 */

// Bind authentication middleware to preserve 'this' context
const auth = authMiddleware.authenticate.bind(authMiddleware);

// Save or update watch history
router.post('/', auth, saveHistory);

// Get user's watch history (with pagination)
router.get('/', auth, getHistory);

// Get analytics for the authenticated user
router.get('/analytics', auth, getHistoryAnalytics);

// Get specific video history (for resume playback)
router.get('/video/:videoId', auth, getHistoryItem);

// Delete all history
router.delete('/', auth, clearHistory);

// Delete single history item
router.delete('/:videoId', auth, deleteHistoryItem);

// Get YouTube video metadata (helper endpoint)
router.get('/youtube/metadata/:videoId', getYouTubeMetadata);

module.exports = router;
