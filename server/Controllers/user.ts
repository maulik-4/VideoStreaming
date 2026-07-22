import { Request, Response } from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import User from "../Modals/user";
import Video from "../Modals/video";

dotenv.config();

interface CookieOptions {
    secure: boolean;
    sameSite: "none" | "lax";
}

interface TokenPayload {
    userId: string;
    deviceId?: string;
}

class UserController {
    private readonly SECRET_KEY: string;

    private readonly cookieOptions: CookieOptions;

    constructor() {
        if (!process.env.SECRET_KEY) {
            throw new Error("SECRET_KEY is missing.");
        }

        this.SECRET_KEY = process.env.SECRET_KEY;

        this.cookieOptions = {
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
        };
    }

    public subscribe = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
           const targetId = req.params.targetId as string;

            const currentUser = req.user;

            if (currentUser._id.equals(targetId)) {
                res.status(400).json({
                    message: "Cannot subscribe to yourself",
                });
                return;
            }

            const alreadySubscribed =
                currentUser.subscriptions?.find(
                    (id) => id.toString() === targetId
                );

            if (alreadySubscribed) {
                res.status(400).json({
                    message: "Already subscribed",
                });
                return;
            }

            currentUser.subscriptions =
                currentUser.subscriptions || [];

            currentUser.subscriptions.push(
    new Types.ObjectId(targetId)
);

            await currentUser.save();

            const targetUser = await User.findById(targetId);

            if (targetUser) {
                targetUser.subscribersCount++;

                await targetUser.save();
            }

            res.status(200).json({
                message: "Subscribed",
            });
        } catch {
            res.status(500).json({
                message: "Failed to subscribe",
            });
        }
    };

    public unsubscribe = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const targetId = req.params.id;

            const currentUser = req.user;

            currentUser.subscriptions =
                currentUser.subscriptions.filter(
                    (id) => id.toString() !== targetId
                );

            await currentUser.save();

            const targetUser = await User.findById(targetId);

            if (targetUser) {
                targetUser.subscribersCount = Math.max(
                    0,
                    targetUser.subscribersCount - 1
                );

                await targetUser.save();
            }

            res.status(200).json({
                message: "Unsubscribed",
            });
        } catch {
            res.status(500).json({
                message: "Failed to unsubscribe",
            });
        }
    };

    public getSubscriptionsVideos = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const subscriptions =
                req.user.subscriptions || [];

            const videos = await Video.find({
                user: {
                    $in: subscriptions,
                },
            }).populate(
                "user",
                "userName channelName profilePic"
            );

            res.status(200).json({
                success: "yes",
                data: videos,
            });
        } catch {
            res.status(500).json({
                message:
                    "Failed to fetch subscriptions videos",
            });
        }
    };

    public getSubscriptionsList = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const subscriptions =
                req.user.subscriptions || [];

            if (!subscriptions.length) {
                res.status(200).json({
                    success: "yes",
                    data: [],
                });
                return;
            }

            const users = await User.find({
                _id: {
                    $in: subscriptions,
                },
            })
                .select(
                    "_id channelName userName profilePic subscribersCount"
                )
                .lean();

            res.status(200).json({
                success: "yes",
                data: users,
            });
        } catch {
            res.status(500).json({
                message:
                    "Failed to fetch subscriptions list",
            });
        }
    };

    public changeRole = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;

            const { role } = req.body;

            if (
                role !== "user" &&
                role !== "admin"
            ) {
                res.status(400).json({
                    message: "Invalid role",
                });
                return;
            }

            const user = await User.findByIdAndUpdate(
                id,
                { role },
                { new: true }
            );

            if (!user) {
                res.status(404).json({
                    message: "User not found",
                });
                return;
            }

            res.status(200).json({
                message: "Role updated",
                user,
            });
        } catch {
            res.status(500).json({
                message: "Failed to change role",
            });
        }
    };

    public getByChannelName = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { channelName } = req.params;

            const user = await User.findOne({
                channelName,
            }).select(
                "_id channelName userName profilePic about"
            );

            if (!user) {
                res.status(404).json({
                    message: "Channel not found",
                });
                return;
            }

            res.status(200).json({
                success: "yes",
                data: user,
            });
        } catch {
            res.status(500).json({
                message: "Failed to fetch channel",
            });
        }
    };
        public userSignup = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const {
                channelName,
                userName,
                password,
                about,
                profilePic,
            } = req.body;

            const userExists = await User.findOne({
                userName,
            });

            if (userExists) {
                res.status(400).json({
                    message: "User already exists",
                });
                return;
            }

            const hashedPassword = await bcrypt.hash(
                password,
                10
            );

            const newUser = new User({
                channelName,
                userName,
                password: hashedPassword,
                about,
                profilePic,
                role: "user",
                isBlocked: false,
            });

            await newUser.save();

            res.status(201).json({
                message: "User created successfully",
                success: "yes",
                data: newUser,
            });
        } catch {
            res.status(500).json({
                message: "Internal server error",
            });
        }
    };

    public userSignin = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const {
                userName,
                password,
                deviceId,
            } = req.body;
            const userExist = await User.findOne({
                userName,
            });
           

            if (!userExist) {
                res.status(404).json({
                    message: "User not found",
                });
                return;
            }

            const isMatch = await bcrypt.compare(
                password,
                userExist.password
            );

            if (!isMatch) {
                res.status(400).json({
                    message: "Invalid credentials",
                });
                return;
            }

            const token = jwt.sign(
                {
                    userId: userExist._id,
                    deviceId,
                },
                this.SECRET_KEY,
                {
                    expiresIn: "1h",
                }
            );

            res.cookie("token", token, {
                ...this.cookieOptions,
                maxAge: 60 * 60 * 1000,
            });

            const cleanUser = {
                _id: userExist._id,
                userName: userExist.userName,
                channelName: userExist.channelName,
                about: userExist.about,
                profilePic: userExist.profilePic,
                role: userExist.role,
            };

            res.status(200).json({
                message: "User logged in successfully",
                success: "yes",
                data: cleanUser,
                token,
                user: cleanUser,
            });
        } catch {
            res.status(500).json({
                message: "Internal server error",
            });
        }
    };

    public userLogout = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        res.clearCookie("token", this.cookieOptions);

        res.status(200).json({
            message: "User logged out successfully",
        });
    };

    public blockUser = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const user = await User.findByIdAndUpdate(
                req.params.id,
                {
                    isBlocked: true,
                }
            );

            if (!user) {
                res.status(404).json({
                    message: "User not found",
                });
                return;
            }

            res.status(200).json({
                message: "User blocked",
            });
        } catch {
            res.status(500).json({
                message: "Error blocking user",
            });
        }
    };

    public unblockUser = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const user = await User.findByIdAndUpdate(
                req.params.id,
                {
                    isBlocked: false,
                }
            );

            if (!user) {
                res.status(404).json({
                    message: "User not found",
                });
                return;
            }

            res.status(200).json({
                message: "User unblocked",
            });
        } catch {
            res.status(500).json({
                message: "Error unblocking user",
            });
        }
    };

    public getAllUsers = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const users = await User.find({});

            res.status(200).json({
                users,
            });
        } catch {
            res.status(500).json({
                message: "Error fetching users",
            });
        }
    };
}

export default new UserController();