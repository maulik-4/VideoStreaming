import { Router } from "express";

import userController from "../Controllers/user";
import authMiddleware from "../middlewares/authentication";
import adminMiddleware from "../middlewares/isAdmin";
import RateLimiter from "../middlewares/rateLimiter";

const router = Router();

// Preserve `this` context
const auth =
    authMiddleware.authenticate.bind(
        authMiddleware
    );

const isAdmin =
    adminMiddleware.checkAdmin.bind(
        adminMiddleware
    );

// Auth Rate Limiter
const authLimiter =
    RateLimiter.authLimiter();

router.post(
    "/signup",
    authLimiter,
    userController.userSignup.bind(
        userController
    )
);

router.post(
    "/login",
    authLimiter,
    userController.userSignin.bind(
        userController
    )
);

router.get(
    "/logout",
    userController.userLogout.bind(
        userController
    )
);

// Subscription routes
router.post(
    "/subscribe/:id",
    auth,
    userController.subscribe.bind(
        userController
    )
);

router.post(
    "/unsubscribe/:id",
    auth,
    userController.unsubscribe.bind(
        userController
    )
);

router.get(
    "/subscriptions/videos",
    auth,
    userController.getSubscriptionsVideos.bind(
        userController
    )
);

router.get(
    "/subscriptions/list",
    auth,
    userController.getSubscriptionsList.bind(
        userController
    )
);

// Admin role change
router.put(
    "/change-role/:id",
    auth,
    isAdmin,
    userController.changeRole.bind(
        userController
    )
);

// Public lookup
router.get(
    "/by-channel/:channelName",
    userController.getByChannelName.bind(
        userController
    )
);

// Admin routes
router.put(
    "/block/:id",
    auth,
    userController.blockUser.bind(
        userController
    )
);

router.put(
    "/unblock/:id",
    auth,
    userController.unblockUser.bind(
        userController
    )
);

router.get(
    "/all-users",
    auth,
    isAdmin,
    userController.getAllUsers.bind(
        userController
    )
);

export default router;  