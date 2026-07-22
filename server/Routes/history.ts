import { Router } from "express";

import {
    saveHistory,
    getHistory,
    getHistoryAnalytics,
    clearHistory,
    deleteHistoryItem,
    getHistoryItem,
    getYouTubeMetadata,
} from "../Controllers/history";

import authMiddleware from "../middlewares/authentication";

const router = Router();

/**
 * History Routes
 * All routes require authentication
 */

// Preserve `this` context
const auth =
    authMiddleware.authenticate.bind(
        authMiddleware
    );

// Save or update watch history
router.post(
    "/",
    auth,
    saveHistory
);

// Get user's watch history (with pagination)
router.get(
    "/",
    auth,
    getHistory
);

// Get analytics for the authenticated user
router.get(
    "/analytics",
    auth,
    getHistoryAnalytics
);

// Get specific video history (resume playback)
router.get(
    "/video/:videoId",
    auth,
    getHistoryItem
);

// Delete all history
router.delete(
    "/",
    auth,
    clearHistory
);

// Delete a single history item
router.delete(
    "/:videoId",
    auth,
    deleteHistoryItem
);

// Get YouTube video metadata
router.get(
    "/youtube/metadata/:videoId",
    getYouTubeMetadata
);

export default router;