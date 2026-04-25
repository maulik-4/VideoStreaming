const express = require('express');
const router = express.Router();
const analysisController = require('../Controllers/analysis');
const { authentication } = require('../middlewares/authentication');

router.get('/:userId', authentication, analysisController.getAnalysis);

module.exports = router;
