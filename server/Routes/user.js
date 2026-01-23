const express = require('express');
const userController = require('../Controllers/user');
const authMiddleware = require('../middlewares/authentication');
const adminMiddleware = require('../middlewares/isAdmin');

const router = express.Router();

// Bind methods to preserve 'this' context
const auth = authMiddleware.authenticate.bind(authMiddleware);
const isAdmin = adminMiddleware.checkAdmin.bind(adminMiddleware);

// Routes
router.post('/signup', userController.userSignup.bind(userController));
router.post('/login', userController.userSignin.bind(userController));
router.get('/logout', userController.userLogout.bind(userController));

// Subscription routes
router.post('/subscribe/:id', auth, userController.subscribe.bind(userController));
router.post('/unsubscribe/:id', auth, userController.unsubscribe.bind(userController));
router.get('/subscriptions/videos', auth, userController.getSubscriptionsVideos.bind(userController));

// Admin role change
router.put('/change-role/:id', auth, isAdmin, userController.changeRole.bind(userController));

// Public lookup by channel name
router.get('/by-channel/:channelName', userController.getByChannelName.bind(userController));

// Admin routes
router.put('/block/:id', auth, userController.blockUser.bind(userController));
router.put('/unblock/:id', auth, userController.unblockUser.bind(userController));
router.get('/all-users', auth, isAdmin, userController.getAllUsers.bind(userController));

module.exports = router;