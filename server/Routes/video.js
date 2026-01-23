const express = require('express');
const videoController = require('../Controllers/video');
const authMiddleware = require('../middlewares/authentication');

const router = express.Router();

// Bind methods to preserve 'this' context
const auth = authMiddleware.authenticate.bind(authMiddleware);

router.post('/upload', auth, videoController.videoUpload.bind(videoController));
router.get('/getAllVideos', videoController.getAllVideos.bind(videoController));
router.get('/getAllVideos/:id', videoController.getVideoById.bind(videoController));
router.get('/:id/getAllVideosById', videoController.getAllvideosById.bind(videoController));
// Comments
router.post('/:id/comments', auth, videoController.addComment.bind(videoController));
router.put('/:videoId/comments/:commentId', auth, videoController.editComment.bind(videoController));

// Edit video metadata (owner or admin)
router.put('/:id', auth, videoController.editVideo.bind(videoController));
router.put('/like/:id', videoController.updateLikes.bind(videoController));
router.put('/dislike/:id', videoController.updateDislikes.bind(videoController));
router.put('/views/:id', videoController.updateViews.bind(videoController));

module.exports = router;