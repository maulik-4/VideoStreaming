import { Request, Response } from "express";

import Video from "../Modals/video";
import redisClient from "../Redis/redisClient";
import { getIO } from "../Socket/socket";


// Add
import { prisma } from "../Connection/Prisma";

class VideoController {
    constructor() { }

    public videoUpload = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const {
                title,
                description,
                videoLink,
                category,
                thumbnail,
            } = req.body;

            const video = await prisma.video.create({
                data: {
                    userId: req.user.id,
                    title,
                    description,
                    videoLink,
                    category,
                    thumbnail,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            channelName: true,
                            profilePic: true,
                        },
                    },
                },
            });

            await redisClient
                .del("home:videos")
                .catch(() => { });

            res.status(201).json({
                message: "Video uploaded successfully",
                success: "yes",
                data: video,
            });
        } catch (error) {
            console.error(error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: "Internal server error",
                });
            }
        }
    };

    public getAllVideos = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        const CACHE_KEY = "home:videos";

        try {
            try {
                const cachedVideos = await redisClient.get(CACHE_KEY);

                if (cachedVideos) {
                    res.status(200).json({
                        message: "Videos fetched successfully",
                        success: "yes",
                        data: JSON.parse(cachedVideos),
                    });
                    return;
                }
            } catch (redisError) {
                console.log("Redis GET Error:", redisError);
            }

            const videos = await prisma.video.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            channelName: true,
                            profilePic: true,
                            isBlocked: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            try {
                await redisClient.set(
                    CACHE_KEY,
                    JSON.stringify(videos),
                    {
                        EX: 300,
                    }
                );
            } catch (redisError) {
                console.log("Redis SET Error:", redisError);
            }

            res.status(200).json({
                message: "Videos fetched successfully",
                success: "yes",
                data: videos,
            });
        } catch (error) {
            console.error(error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: "Internal server error",
                });
            }
        }
    };

    public getVideoById = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;

            const video = await prisma.video.findUnique({
                where: {
                    id,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            channelName: true,
                            profilePic: true,
                        },
                    },
                    comments: {
                        orderBy: {
                            createdAt: "desc",
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    userName: true,
                                    channelName: true,
                                    profilePic: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!video) {
                res.status(404).json({
                    message: "Video not found",
                });
                return;
            }

            res.status(200).json({
                message: "Video fetched successfully",
                success: "yes",
                data: video,
            });
        } catch (error) {
            console.error(error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: "Internal server error",
                });
            }
        }
    };



    public getAllvideosById = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;

            const videos = await prisma.video.findMany({
                where: {
                    userId: id,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            channelName: true,
                            profilePic: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            res.status(200).json({
                message: "Videos fetched successfully",
                success: "yes",
                data: videos,
            });
        } catch (error) {
            console.error(error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: "Internal server error",
                });
            }
        }
    };

    public updateLikes = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;

            const updatedVideo = await prisma.video.update({
                where: {
                    id,
                },
                data: {
                    likes: {
                        increment: 1,
                    },
                },
                select: {
                    likes: true,
                },
            });

            await redisClient
                .del("home:videos")
                .catch(() => { });

            res.status(200).json({
                message: "Like added successfully",
                likes: updatedVideo.likes,
            });
        } catch (error) {
            console.error(error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: "Internal server error",
                });
            }
        }
    };
    public updateDislikes = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;

            const updatedVideo = await prisma.video.update({
                where: {
                    id,
                },
                data: {
                    dislike: {
                        increment: 1,
                    },
                },
                select: {
                    dislike: true,
                },
            });

            await redisClient
                .del("home:videos")
                .catch(() => { });

            res.status(200).json({
                message: "Dislike added successfully",
                dislike: updatedVideo.dislike,
            });
        } catch (error) {
            console.error(error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: "Internal server error",
                });
            }
        }
    };

    public updateViews = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;

            const updatedVideo = await prisma.video.update({
                where: {
                    id,
                },
                data: {
                    views: {
                        increment: 1,
                    },
                },
                select: {
                    views: true,
                },
            });

            await redisClient
                .del("home:videos")
                .catch(() => { });

            res.status(200).json({
                message: "Views updated successfully",
                views: updatedVideo.views,
            });
        } catch (error) {
            console.error(error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: "Internal server error",
                });
            }
        }
    };

    public addComment = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const { text } = req.body;

            if (!text || !text.trim()) {
                res.status(400).json({
                    message: "Comment cannot be empty",
                });
                return;
            }

            const video = await prisma.video.findUnique({
                where: {
                    id,
                },
                select: {
                    id: true,
                },
            });

            if (!video) {
                res.status(404).json({
                    message: "Video not found",
                });
                return;
            }

            const comment = await prisma.comment.create({
                data: {
                    text: text.trim(),
                    userId: req.user.id,
                    videoId: id,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            channelName: true,
                            profilePic: true,
                        },
                    },
                },
            });

            await redisClient
                .del("home:videos")
                .catch(() => { });

            getIO()
                .to(id)
                .emit("new-comment", {
                    videoId: id,
                    comment,
                });

            res.status(201).json({
                message: "Comment added",
                comment,
            });
        } catch (error) {
            console.error(error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: "Failed to add comment",
                });
            }
        }
    };

    public editComment = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { videoId, commentId } = req.params;
            const { text } = req.body;

            if (!text || !text.trim()) {
                res.status(400).json({
                    message: "Comment cannot be empty",
                });
                return;
            }

            const comment = await prisma.comment.findUnique({
                where: {
                    id: commentId,
                },
                include: {
                    user: true,
                },
            });

            if (!comment) {
                res.status(404).json({
                    message: "Comment not found",
                });
                return;
            }

            if (comment.videoId !== videoId) {
                res.status(400).json({
                    message: "Invalid comment",
                });
                return;
            }

            const isOwner = comment.userId === req.user.id;
            const isAdmin = req.user.role === "admin";

            if (!isOwner && !isAdmin) {
                res.status(403).json({
                    message: "Not allowed",
                });
                return;
            }

            const updatedComment = await prisma.comment.update({
                where: {
                    id: commentId,
                },
                data: {
                    text: text.trim(),
                    edited: true,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            channelName: true,
                            profilePic: true,
                        },
                    },
                },
            });

            await redisClient
                .del("home:videos")
                .catch(() => { });

            getIO()
                .to(videoId)
                .emit("edit-comment", {
                    videoId,
                    commentId,
                    text: updatedComment.text,
                    edited: true,
                });

            res.status(200).json({
                message: "Comment updated",
                comment: updatedComment,
            });
        } catch (error) {
            console.error(error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: "Failed to edit comment",
                });
            }
        }
    };
    public editVideo = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;
            const {
                title,
                description,
                category,
            } = req.body;

            const video = await prisma.video.findUnique({
                where: {
                    id,
                },
                select: {
                    id: true,
                    userId: true,
                },
            });

            if (!video) {
                res.status(404).json({
                    message: "Video not found",
                });
                return;
            }

            const isOwner = video.userId === req.user.id;
            const isAdmin = req.user.role === "admin";

            if (!isOwner && !isAdmin) {
                res.status(403).json({
                    message: "Not allowed",
                });
                return;
            }

            const updatedVideo = await prisma.video.update({
                where: {
                    id,
                },
                data: {
                    ...(title && { title }),
                    ...(description && { description }),
                    ...(category && { category }),
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            channelName: true,
                            profilePic: true,
                        },
                    },
                },
            });

            await redisClient
                .del("home:videos")
                .catch(() => { });

            res.status(200).json({
                message: "Video updated",
                data: updatedVideo,
            });
        } catch (error) {
            console.error(error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: "Failed to update video",
                });
            }
        }
    };

    public searchVideos = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { q } = req.query;

            if (!q || typeof q !== "string" || !q.trim()) {
                res.status(400).json({
                    message: "Search query is required",
                });
                return;
            }

            const searchQuery = q.trim();

            const CACHE_KEY = `search:${searchQuery.toLowerCase()}`;

            try {
                const cachedResults =
                    await redisClient.get(CACHE_KEY);

                if (cachedResults) {
                    res.status(200).json({
                        message: "Search results fetched successfully",
                        success: "yes",
                        data: JSON.parse(cachedResults),
                    });
                    return;
                }
            } catch (redisError) {
                console.error(
                    "Redis cache read failed:",
                    redisError
                );
            }

            const videos = await prisma.video.findMany({
                where: {
                    OR: [
                        {
                            title: {
                                contains: searchQuery,
                                mode: "insensitive",
                            },
                        },
                        {
                            description: {
                                contains: searchQuery,
                                mode: "insensitive",
                            },
                        },
                        {
                            category: {
                                contains: searchQuery,
                                mode: "insensitive",
                            },
                        },
                    ],
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            channelName: true,
                            profilePic: true,
                            isBlocked: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            try {
                await redisClient.set(
                    CACHE_KEY,
                    JSON.stringify(videos),
                    {
                        EX: 300,
                    }
                );
            } catch (redisError) {
                console.error(
                    "Redis cache write failed:",
                    redisError
                );
            }

            res.status(200).json({
                message: "Search results fetched successfully",
                success: "yes",
                data: videos,
            });
        } catch (error) {
            console.error(error);

            if (!res.headersSent) {
                res.status(500).json({
                    message: "Search failed",
                });
            }
        }
    };
}

export default new VideoController();