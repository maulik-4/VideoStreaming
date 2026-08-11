import { Request, Response } from "express";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../Connection/Prisma";

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

            const userExists = await prisma.user.findUnique({
                where: {
                    userName,
                },
            });

            if (userExists) {
                res.status(400).json({
                    message: "User already exists",
                });
                return;
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await prisma.user.create({
                data: {
                    channelName,
                    userName,
                    password: hashedPassword,
                    about,
                    profilePic,
                },
                select: {
                    id: true,
                    channelName: true,
                    userName: true,
                    about: true,
                    profilePic: true,
                    role: true,
                    isBlocked: true,
                    subscribersCount: true,
                    createdAt: true,
                },
            });

            res.status(201).json({
                message: "User created successfully",
                success: "yes",
                data: newUser,
            });
        } catch (error) {
            console.error(error);

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

            const userExist = await prisma.user.findUnique({
                where: {
                    userName,
                },
                select: {
                    id: true,
                    userName: true,
                    channelName: true,
                    about: true,
                    profilePic: true,
                    role: true,
                    password: true,
                },
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
                    userId: userExist.id,
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
                id: userExist.id,
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
        } catch (error) {
            console.error(error);

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
            const user = await prisma.user.update({
                where: {
                    id: req.params.id as string,
                },
                data: {
                    isBlocked: true,
                },
            });

            res.status(200).json({
                message: "User blocked",
                data: user,
            });
        } catch (error) {
            console.error(error);

            res.status(404).json({
                message: "User not found",
            });
        }
    };
    public unblockUser = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const user = await prisma.user.update({
                where: {
                    id: req.params.id as string,
                },
                data: {
                    isBlocked: false,
                },
            });

            res.status(200).json({
                message: "User unblocked",
                data: user,
            });
        } catch (error) {
            console.error(error);

            res.status(404).json({
                message: "User not found",
            });
        }
    };
    public subscribe = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const targetId = req.params.targetId as string;

            const currentUser = req.user;

            if (currentUser.id === targetId) {
                res.status(400).json({
                    message: "Cannot subscribe to yourself",
                });
                return;
            }

            const dbUser = await prisma.user.findUnique({
                where: { id: currentUser.id },
                include: { subscriptions: true }
            });

            const alreadySubscribed = dbUser?.subscriptions.some(sub => sub.id === targetId);

            if (alreadySubscribed) {
                res.status(400).json({
                    message: "Already subscribed",
                });
                return;
            }

            await prisma.user.update({
                where: { id: currentUser.id },
                data: {
                    subscriptions: {
                        connect: { id: targetId }
                    }
                }
            });

            await prisma.user.update({
                where: { id: targetId },
                data: {
                    subscribersCount: { increment: 1 }
                }
            });

            res.status(200).json({
                message: "Subscribed",
            });
        } catch (error) {
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
            const targetId = req.params.id as string;
            const currentUser = req.user;

            await prisma.user.update({
                where: { id: currentUser.id },
                data: {
                    subscriptions: {
                        disconnect: { id: targetId }
                    }
                }
            });

            const targetUser = await prisma.user.findUnique({ where: { id: targetId } });

            if (targetUser && targetUser.subscribersCount > 0) {
                await prisma.user.update({
                    where: { id: targetId },
                    data: {
                        subscribersCount: { decrement: 1 }
                    }
                });
            }

            res.status(200).json({
                message: "Unsubscribed",
            });
        } catch (error) {
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
            const dbUser = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { subscriptions: true }
            });

            const subscriptionIds = dbUser?.subscriptions.map(sub => sub.id) || [];

            const videos = await prisma.video.findMany({
                where: {
                    userId: { in: subscriptionIds }
                },
                include: {
                    user: {
                        select: {
                            userName: true,
                            channelName: true,
                            profilePic: true
                        }
                    }
                }
            });

            res.status(200).json({
                success: "yes",
                data: videos,
            });
        } catch (error) {
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
            const dbUser = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { subscriptions: true }
            });

            const subscriptions = dbUser?.subscriptions || [];

            if (!subscriptions.length) {
                res.status(200).json({
                    success: "yes",
                    data: [],
                });
                return;
            }

            const users = await prisma.user.findMany({
                where: {
                    id: { in: subscriptions.map(sub => sub.id) }
                },
                select: {
                    id: true,
                    channelName: true,
                    userName: true,
                    profilePic: true,
                    subscribersCount: true
                }
            });

            res.status(200).json({
                success: "yes",
                data: users,
            });
        } catch (error) {
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
            const id = req.params.id as string;

            const { role } = req.body;

            if (role !== "USER" && role !== "ADMIN") {
                res.status(400).json({
                    message: "Invalid role",
                });
                return;
            }

            const user = await prisma.user.update({
                where: { id },
                data: { role: role as Role }
            });

            res.status(200).json({
                message: "Role updated",
                user,
            });
        } catch (error) {
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
            const channelName = req.params.channelName as string;

            const user = await prisma.user.findFirst({
                where: {
                    channelName,
                },
                select: {
                    id: true,
                    channelName: true,
                    userName: true,
                    profilePic: true,
                    about: true,
                },
            });

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
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to fetch channel",
            });
        }
    };


    public getAllUsers = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    channelName: true,
                    userName: true,
                    about: true,
                    profilePic: true,
                    role: true,
                    isBlocked: true,
                    subscribersCount: true,
                    createdAt: true,
                },
            });

            res.status(200).json({
                users,
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Error fetching users",
            });
        }
    };
}

export default new UserController();