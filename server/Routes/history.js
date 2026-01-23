const express = require('express');
const router = express.Router();
const {
    saveHistory,
    getHistory,
    clearHistory,
    deleteHistoryItem,
    getHistoryItem,
    getYouTubeMetadata
} = require('../Controllers/history');
const auth = require('../middlewares/authentication');

/**
 * History Routes
 * All routes require authentication
 */

// Save or update watch history
router.post('/', auth.authenticate.bind(auth), saveHistory);

// Get user's watch history (with pagination)
router.get('/', auth.authenticate.bind(auth), getHistory);

// Get specific video history (for resume playback)
router.get('/video/:videoId', auth.authenticate.bind(auth), getHistoryItem);

// Delete all history
router.delete('/', auth.authenticate.bind(auth), clearHistory);

// Delete single history item
router.delete('/:videoId', auth.authenticate.bind(auth), deleteHistoryItem);

// Get YouTube video metadata (helper endpoint)
router.get('/youtube/metadata/:videoId', getYouTubeMetadata);

module.exports = router;
