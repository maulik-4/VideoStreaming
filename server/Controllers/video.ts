import { Request, Response } from "express";

import Video from "../Modals/video";
import redisClient from "../Redis/redisClient";
import { getIO } from "../Socket/socket";

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

            const videoUpload = new Video({
                user: req.user._id,
                title,
                description,
                videoLink,
                category,
                thumbnail,
            });

            await videoUpload.save();

            await redisClient
                .del("home:videos")
                .catch(() => { });

            res.status(201).json({
                message: "Video uploaded successfully",
                success: "yes",
                data: videoUpload,
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
                    // IMPORTANT: stop here on a cache hit, otherwise
                    // execution falls through to the Mongo fetch below
                    // and sends a second response -> ERR_HTTP_HEADERS_SENT
                    return;
                }
            } catch (redisError) {
                console.log("Redis GET Error:", redisError);
            }

            const videos = await Video.find()
                .populate(
                    "user",
                    "userName channelName profilePic isBlocked"
                )
                .lean();

            try {
                await redisClient.set(
                    CACHE_KEY,
                    JSON.stringify(videos),
                    { EX: 300 }
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

            const videoData = await Video.findById(id)
                .populate(
                    "user",
                    "userName channelName profilePic"
                )
                .populate({
                    path: "comments.user",
                    select:
                        "userName channelName profilePic",
                });

            if (!videoData) {
                res.status(404).json({
                    message: "Video not found",
                });
                return;
            }

            res.status(200).json({
                message: "Video fetched successfully",
                success: "yes",
                data: videoData,
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

            const videos = await Video.find({
                user: id,
            }).populate(
                "user",
                "userName channelName profilePic"
            );

            if (!videos) {
                res.status(404).json({
                    message: "Videos not found",
                });
                return;
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

    public updateLikes = async (
        req: Request,
        res: Response
    ): Promise<void> => {
        try {
            const { id } = req.params;

            const videoData = await Video.findById(id);

            if (!videoData) {
                res.status(404).json({
                    message: "Video not found",
                });
                return;
            }

            videoData.likes += 1;

            const updatedVideo = await videoData.save();

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

            const videoData = await Video.findById(id);

            if (!videoData) {
                res.status(404).json({
                    message: "Video not found",
                });
                return;
            }

            videoData.dislike += 1;

            const updatedVideo = await videoData.save();

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

            const videoData = await Video.findById(id);

            if (!videoData) {
                res.status(404).json({
                    message: "Video not found",
                });
                return;
            }

            videoData.views += 1;

            const updatedVideo = await videoData.save();

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

            const video = await Video.findById(id);

            if (!video) {
                res.status(404).json({
                    message: "Video not found",
                });
                return;
            }

            const comment = {
                user: req.user._id,
                text,
            };

            video.comments.push(comment);

            await video.save();

            await redisClient
                .del("home:videos")
                .catch(() => { });

            await video.populate({
                path: "comments.user",
                select:
                    "userName channelName profilePic",
            });

            const newComment =
                video.comments[video.comments.length - 1];

            getIO()
                .to(String(id))
                .emit("new-comment", {
                    videoId: String(id),
                    comment: newComment,
                });

            res.status(201).json({
                message: "Comment added",
                comment: newComment,
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
            const videoId = req.params.videoId as string;
            const commentId = req.params.commentId as string;
            const { text } = req.body;

            if (!text || !text.trim()) {
                res.status(400).json({
                    message: "Comment cannot be empty",
                });
                return;
            }

            const video = await Video.findById(videoId);

            if (!video) {
                res.status(404).json({
                    message: "Video not found",
                });
                return;
            }

            const comment = video.comments.id(commentId);

            if (!comment) {
                res.status(404).json({
                    message: "Comment not found",
                });
                return;
            }

            if (
                comment.user.toString() !==
                req.user._id.toString()
            ) {
                res.status(403).json({
                    message: "Not allowed",
                });
                return;
            }

            comment.text = text;
            comment.edited = true;

            await video.save();

            await redisClient
                .del("home:videos")
                .catch(() => { });

            getIO()
                .to(videoId)
                .emit("edit-comment", {
                    videoId,
                    commentId,
                    text,
                    edited: true,
                });

            res.status(200).json({
                message: "Comment updated",
                comment,
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

            const video = await Video.findById(id);

            if (!video) {
                res.status(404).json({
                    message: "Video not found",
                });
                return;
            }

            const isOwner =
                video.user.toString() ===
                req.user._id.toString();

            const isAdmin =
                req.user.role === "admin";

            if (!isOwner && !isAdmin) {
                res.status(403).json({
                    message: "Not allowed",
                });
                return;
            }

            if (title) {
                video.title = title;
            }

            if (description) {
                video.description = description;
            }

            if (category) {
                video.category = category;
            }

            await video.save();

            await redisClient
                .del("home:videos")
                .catch(() => { });

            res.status(200).json({
                message: "Video updated",
                data: video,
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

            if (
                !q ||
                typeof q !== "string" ||
                !q.trim()
            ) {
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
                        message:
                            "Search results fetched successfully",
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

            const videos = await Video.find({
                $or: [
                    {
                        title: {
                            $regex: searchQuery,
                            $options: "i",
                        },
                    },
                    {
                        description: {
                            $regex: searchQuery,
                            $options: "i",
                        },
                    },
                    {
                        category: {
                            $regex: searchQuery,
                            $options: "i",
                        },
                    },
                ],
            })
                .populate(
                    "user",
                    "userName channelName profilePic isBlocked"
                )
                .lean();

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
                message:
                    "Search results fetched successfully",
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