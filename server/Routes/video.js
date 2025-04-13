const express = require('express');
const video = require('../Controllers/video');
const router = express.Router();
const auth = require('../middlewares/authentication')
router.post('/upload' ,auth , video.videoUpload);

router.get('/getAllVideos', video.getAllVideos);
router.get('/getAllVideos/:id', video.getVideoById);
router.get('/:id/getAllVideosById', video.getAllvideosById);
router.put('/like/:id' , video.UpdateLikes);
router.put('/dislike/:id' , video.UpdateDislikes);
router.put('/views/:id' , video.UpdateViews);

module.exports = router;