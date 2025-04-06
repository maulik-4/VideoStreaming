const express = require('express');
const video = require('../Controllers/video');
const router = express.Router();
const auth = require('../middlewares/authentication')
router.post('/upload' ,auth , video.videoUpload);

router.get('/getAllVideos', video.getAllVideos);
router.get('/getAllVideos/:id', video.getVideoById);
router.get('/:id/getAllVideosById', video.getAllvideosById);

module.exports = router;