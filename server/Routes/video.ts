import { Router } from "express";

import videoController from "../Controllers/video";
import authMiddleware from "../middlewares/authentication";
import RateLimiter from "../middlewares/rateLimiter";

const router = Router();

// Preserve `this` context
const auth =
    authMiddleware.authenticate.bind(
        authMiddleware
    );

// Rate limiters
const searchLimiter =
    RateLimiter.searchLimiter();

const commentsLimiter =
    RateLimiter.commentsLimiter();

router.post(
    "/upload",
    auth,
    videoController.videoUpload.bind(
        videoController
    )
);
router.get("/test", (req, res) => {
    console.log("Test route");
    res.json({ ok: true });
});
router.get(
    "/getAllVideos",
    videoController.getAllVideos.bind(
        videoController
    )
);

router.get(
    "/getAllVideos/:id",
    videoController.getVideoById.bind(
        videoController
    )
);


router.get(
    "/:id/getAllVideosById",
    videoController.getAllvideosById.bind(
        videoController
    )
);

// Search endpoint with rate limiting
router.get(
    "/search",
    auth,
    searchLimiter,
    videoController.searchVideos.bind(
        videoController
    )
);

// Comments with rate limiting
router.post(
    "/:id/comments",
    auth,
    commentsLimiter,
    videoController.addComment.bind(
        videoController
    )
);

router.put(
    "/:videoId/comments/:commentId",
    auth,
    commentsLimiter,
    videoController.editComment.bind(
        videoController
    )
);

// Edit video metadata (owner or admin)
router.put(
    "/:id",
    auth,
    videoController.editVideo.bind(
        videoController
    )
);

router.put(
    "/like/:id",
    videoController.updateLikes.bind(
        videoController
    )
);

router.put(
    "/dislike/:id",
    videoController.updateDislikes.bind(
        videoController
    )
);

router.put(
    "/views/:id",
    videoController.updateViews.bind(
        videoController
    )
);

export default router;