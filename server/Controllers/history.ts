import { Request, Response } from "express";

import History from "../Modals/history";
import Video from "../Modals/video";
import type { UserDocument } from "../Modals/user";
import youtubeService from "../utils/youtubeService";

export const saveHistory = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user._id;

        const {
            videoId,
            platform,
            progress,
            duration,
            title,
            thumbnail,
            channelName,
        } = req.body;

        if (!videoId || !platform) {
            res.status(400).json({
                success: false,
                message:
                    "videoId and platform are required",
            });
            return;
        }

        if (
            platform !== "local" &&
            platform !== "youtube"
        ) {
            res.status(400).json({
                success: false,
                message:
                    'platform must be "local" or "youtube"',
            });
            return;
        }

        const MIN_WATCH_TIME = 5;

        if ((progress ?? 0) < MIN_WATCH_TIME) {
            res.status(200).json({
                success: true,
                message:
                    "Video watched for less than 5 seconds, not saved to history",
            });
            return;
        }

        let videoData: {
            title?: string;
            thumbnail?: string;
            channelName?: string;
            uploadedBy?: unknown;
            duration?: number;
        } = {};

        if (platform === "local") {
            const video = await Video.findById(
                videoId
            ).populate(
                "user",
                "channelName profilePic"
            );

            if (!video) {
                res.status(404).json({
                    success: false,
                    message: "Video not found",
                });
                return;
            }

          videoData = {
    title: video.title,
    thumbnail: video.thumbnail,
    channelName:
        (video.user as unknown as UserDocument)?.channelName ??
        "Unknown",
    uploadedBy:
        (video.user as unknown as UserDocument)._id,
    duration: duration ?? 0,
};
        } else {
            if (
                title &&
                thumbnail &&
                channelName
            ) {
                videoData = {
                    title,
                    thumbnail,
                    channelName,
                    duration: duration ?? 0,
                };
            } else {
                try {
                    const ytMetadata =
                        await youtubeService.getVideoMetadata(
                            videoId
                        );

                    videoData = {
                        title: ytMetadata.title,
                        thumbnail:
                            ytMetadata.thumbnail,
                        channelName:
                            ytMetadata.channelName,
                        duration:
                            ytMetadata.duration,
                    };
                } catch (error) {
                    console.error(error);

                    videoData = {
                        title:
                            title ??
                            "YouTube Video",
                        thumbnail:
                            thumbnail ??
                            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                        channelName:
                            channelName ??
                            "Unknown",
                        duration: duration ?? 0,
                    };
                }
            }
        }

        const historyEntry =
            await History.findOneAndUpdate(
                {
                    user: userId,
                    videoId: String(videoId),
                    platform,
                },
                {
                    $set: {
                        ...videoData,
                        progress: progress ?? 0,
                        watchedAt: new Date(),
                    },
                    $inc: {
                        watchCount: 1,
                    },
                    $setOnInsert: {
                        firstWatchedAt:
                            new Date(),
                    },
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                }
            );

        historyEntry.updateCompletionStatus();

        await historyEntry.save();

        await History.cleanOldHistory(
            userId,
            100
        );

        res.status(200).json({
            success: true,
            message:
                "History saved successfully",
            data: historyEntry,
        });
    } catch (error) {
        if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === 11000
        ) {
            res.status(409).json({
                success: false,
                message:
                    "History entry already exists",
            });
            return;
        }

        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Failed to save history",
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
        });
    }
};
export const getHistory = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user._id;

        const page =
            Number.parseInt(req.query.page as string, 10) ||
            1;

        const limit =
            Number.parseInt(req.query.limit as string, 10) ||
            20;

        const platformFilter =
            req.query.platform as
                | "local"
                | "youtube"
                | undefined;

        const maxLimit = 100;
        const validLimit = Math.min(limit, maxLimit);
        const skip = (page - 1) * validLimit;

        const query: {
            user: typeof userId;
            platform?: "local" | "youtube";
        } = {
            user: userId,
        };

        if (
            platformFilter &&
            (platformFilter === "local" ||
                platformFilter === "youtube")
        ) {
            query.platform = platformFilter;
        }

        const [history, totalCount] =
            await Promise.all([
                History.find(query)
                    .sort({
                        watchedAt: -1,
                    })
                    .skip(skip)
                    .limit(validLimit)
                    .populate(
                        "uploadedBy",
                        "channelName profilePic"
                    )
                    .lean(),

                History.countDocuments(query),
            ]);

        const historyWithMeta = history.map(
            (item) => ({
                ...item,

                watchPercentage:
                    item.duration > 0
                        ? Math.min(
                              100,
                              Math.round(
                                  (item.progress /
                                      item.duration) *
                                      100
                              )
                          )
                        : 0,
            })
        );

        res.status(200).json({
            success: true,
            data: historyWithMeta,

            pagination: {
                currentPage: page,

                totalPages: Math.ceil(
                    totalCount / validLimit
                ),

                totalItems: totalCount,

                itemsPerPage: validLimit,

                hasMore:
                    skip + history.length <
                    totalCount,
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch history",

            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
        });
    }
};
export const getHistoryAnalytics = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user._id;

        const analytics = await History.aggregate([
            {
                $match: {
                    user: userId,
                },
            },
            {
                $addFields: {
                    progressSafe: {
                        $convert: {
                            input: "$progress",
                            to: "double",
                            onError: 0,
                            onNull: 0,
                        },
                    },

                    durationSafe: {
                        $convert: {
                            input: "$duration",
                            to: "double",
                            onError: 0,
                            onNull: 0,
                        },
                    },

                    watchedAtSafe: {
                        $ifNull: [
                            "$watchedAt",
                            "$createdAt",
                        ],
                    },

                    watchTime: {
                        $cond: [
                            {
                                $gt: [
                                    "$durationSafe",
                                    0,
                                ],
                            },
                            {
                                $min: [
                                    "$progressSafe",
                                    "$durationSafe",
                                ],
                            },
                            "$progressSafe",
                        ],
                    },

                    videoObjectId: {
                        $cond: [
                            {
                                $eq: [
                                    "$platform",
                                    "local",
                                ],
                            },
                            {
                                $convert: {
                                    input: "$videoId",
                                    to: "objectId",
                                    onError: null,
                                    onNull: null,
                                },
                            },
                            null,
                        ],
                    },

                    language: {
                        $cond: [
                            {
                                $regexMatch: {
                                    input: "$title",
                                    regex: "[ऀ-ॿ]",
                                },
                            },
                            "Hindi / Regional",
                            "English / Other",
                        ],
                    },
                },
            },

            {
                $lookup: {
                    from: "videos",
                    localField: "videoObjectId",
                    foreignField: "_id",
                    as: "videoMeta",
                },
            },

            {
                $addFields: {
                    category: {
                        $cond: [
                            {
                                $eq: [
                                    "$platform",
                                    "local",
                                ],
                            },
                            {
                                $ifNull: [
                                    {
                                        $arrayElemAt: [
                                            "$videoMeta.category",
                                            0,
                                        ],
                                    },
                                    "Unknown",
                                ],
                            },
                            "YouTube",
                        ],
                    },

                    durationBucket: {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $lte: [
                                            "$durationSafe",
                                            300,
                                        ],
                                    },
                                    then: "Short (<5 min)",
                                },
                                {
                                    case: {
                                        $and: [
                                            {
                                                $gt: [
                                                    "$durationSafe",
                                                    300,
                                                ],
                                            },
                                            {
                                                $lte: [
                                                    "$durationSafe",
                                                    1200,
                                                ],
                                            },
                                        ],
                                    },
                                    then: "Medium (5-20 min)",
                                },
                                {
                                    case: {
                                        $gt: [
                                            "$durationSafe",
                                            1200,
                                        ],
                                    },
                                    then: "Long (>20 min)",
                                },
                            ],

                            default: "Unknown",
                        },
                    },
                },
            },

            {
                $project: {
                    videoMeta: 0,
                    videoObjectId: 0,
                },
            },

            {
                $facet: {
                    totals: [
                        {
                            $group: {
                                _id: null,
                                totalWatchTime: {
                                    $sum: "$watchTime",
                                },
                                totalEntries: {
                                    $sum: 1,
                                },
                                completedCount: {
                                    $sum: {
                                        $cond: [
                                            "$completed",
                                            1,
                                            0,
                                        ],
                                    },
                                },
                                averageWatchTime: {
                                    $avg: "$watchTime",
                                },
                            },
                        },
                    ],

                    platformBreakdown: [
                        {
                            $group: {
                                _id: "$platform",
                                watchTime: {
                                    $sum: "$watchTime",
                                },
                                count: {
                                    $sum: 1,
                                },
                            },
                        },
                        {
                            $sort: {
                                watchTime: -1,
                            },
                        },
                    ],

                    perVideo: [
                        {
                            $group: {
                                _id: {
                                    videoId:
                                        "$videoId",
                                    platform:
                                        "$platform",
                                    title:
                                        "$title",
                                    thumbnail:
                                        "$thumbnail",
                                    channelName:
                                        "$channelName",
                                },

                                watchTime: {
                                    $sum: "$watchTime",
                                },

                                count: {
                                    $sum: 1,
                                },
                            },
                        },

                        {
                            $sort: {
                                watchTime: -1,
                            },
                        },

                        {
                            $limit: 20,
                        },
                    ],
                                        perCategory: [
                        {
                            $group: {
                                _id: "$category",
                                watchTime: {
                                    $sum: "$watchTime",
                                },
                                count: {
                                    $sum: 1,
                                },
                            },
                        },
                        {
                            $sort: {
                                watchTime: -1,
                            },
                        },
                        {
                            $limit: 20,
                        },
                    ],

                    perChannel: [
                        {
                            $group: {
                                _id: "$channelName",
                                watchTime: {
                                    $sum: "$watchTime",
                                },
                                count: {
                                    $sum: 1,
                                },
                            },
                        },
                        {
                            $sort: {
                                watchTime: -1,
                            },
                        },
                        {
                            $limit: 20,
                        },
                    ],

                    durationBuckets: [
                        {
                            $group: {
                                _id: "$durationBucket",
                                watchTime: {
                                    $sum: "$watchTime",
                                },
                                count: {
                                    $sum: 1,
                                },
                            },
                        },
                        {
                            $sort: {
                                watchTime: -1,
                            },
                        },
                    ],

                    languageBreakdown: [
                        {
                            $group: {
                                _id: "$language",
                                watchTime: {
                                    $sum: "$watchTime",
                                },
                                count: {
                                    $sum: 1,
                                },
                            },
                        },
                        {
                            $sort: {
                                watchTime: -1,
                            },
                        },
                    ],

                    daily: [
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: "$watchedAtSafe",
                                    },
                                },
                                watchTime: {
                                    $sum: "$watchTime",
                                },
                                count: {
                                    $sum: 1,
                                },
                            },
                        },
                        {
                            $sort: {
                                _id: 1,
                            },
                        },
                        {
                            $limit: 30,
                        },
                    ],

                    weekly: [
                        {
                            $group: {
                                _id: {
                                    year: {
                                        $isoWeekYear:
                                            "$watchedAtSafe",
                                    },
                                    week: {
                                        $isoWeek:
                                            "$watchedAtSafe",
                                    },
                                },
                                watchTime: {
                                    $sum: "$watchTime",
                                },
                                count: {
                                    $sum: 1,
                                },
                            },
                        },
                        {
                            $sort: {
                                "_id.year": 1,
                                "_id.week": 1,
                            },
                        },
                        {
                            $limit: 12,
                        },
                    ],

                    peakHours: [
                        {
                            $group: {
                                _id: {
                                    $hour: "$watchedAtSafe",
                                },
                                watchTime: {
                                    $sum: "$watchTime",
                                },
                                count: {
                                    $sum: 1,
                                },
                            },
                        },
                        {
                            $sort: {
                                watchTime: -1,
                            },
                        },
                        {
                            $limit: 24,
                        },
                    ],
                },
            },
        ]);

        const result = analytics[0] ?? {};

        const totals =
            result.totals?.[0] ?? {
                totalWatchTime: 0,
                totalEntries: 0,
                completedCount: 0,
                averageWatchTime: 0,
            };

        res.status(200).json({
            success: true,
            data: {
                totals,
                platformBreakdown:
                    result.platformBreakdown ?? [],
                perVideo:
                    result.perVideo ?? [],
                perCategory:
                    result.perCategory ?? [],
                perChannel:
                    result.perChannel ?? [],
                durationBuckets:
                    result.durationBuckets ?? [],
                languageBreakdown:
                    result.languageBreakdown ??
                    [],
                daily:
                    result.daily ?? [],
                weekly:
                    result.weekly ?? [],
                peakHours:
                    result.peakHours ?? [],
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch analytics",
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
        });
    }
};
export const clearHistory = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user._id;

        const result = await History.deleteMany({
            user: userId,
        });

        res.status(200).json({
            success: true,
            message: "History cleared successfully",
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to clear history",
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
        });
    }
};

export const deleteHistoryItem = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user._id;

        const { videoId } = req.params;

        const platform = req.query.platform as
            | "local"
            | "youtube"
            | undefined;

        if (
            !platform ||
            (platform !== "local" &&
                platform !== "youtube")
        ) {
            res.status(400).json({
                success: false,
                message:
                    "Valid platform query parameter is required (local or youtube)",
            });
            return;
        }

        const result =
            await History.findOneAndDelete({
                user: userId,
                videoId,
                platform,
            });

        if (!result) {
            res.status(404).json({
                success: false,
                message:
                    "History item not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message:
                "History item deleted successfully",
            data: result,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Failed to delete history item",
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
        });
    }
};

export const getHistoryItem = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user._id;

        const { videoId } = req.params;

        const platform = req.query.platform as
            | "local"
            | "youtube"
            | undefined;

        if (
            !platform ||
            (platform !== "local" &&
                platform !== "youtube")
        ) {
            res.status(400).json({
                success: false,
                message:
                    "Valid platform query parameter is required (local or youtube)",
            });
            return;
        }

        const historyItem =
            await History.findOne({
                user: userId,
                videoId,
                platform,
            }).populate(
                "uploadedBy",
                "channelName profilePic"
            );

        if (!historyItem) {
            res.status(404).json({
                success: false,
                message:
                    "No history found for this video",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: historyItem,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch history item",
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error",
        });
    }
};

export const getYouTubeMetadata = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const videoId = req.params.videoId as string;

        if (
            !youtubeService.isValidVideoId(
                videoId
            )
        ) {
            res.status(400).json({
                success: false,
                message:
                    "Invalid YouTube video ID",
            });
            return;
        }

        const metadata =
            await youtubeService.getVideoMetadata(
                videoId
            );

        res.status(200).json({
            success: true,
            data: metadata,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch YouTube metadata",
        });
    }
};

export default {
    saveHistory,
    getHistory,
    getHistoryAnalytics,
    clearHistory,
    deleteHistoryItem,
    getHistoryItem,
    getYouTubeMetadata,
};