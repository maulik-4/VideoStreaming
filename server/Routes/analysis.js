const express = require('express');
const router = express.Router();
const { getAnalysis } = require('../Controllers/analysis');
const authentication = require('../middlewares/authentication');

router.get('/:userId', authentication.authenticate.bind(authentication), getAnalysis);

module.exports = router;
