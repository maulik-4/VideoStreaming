import { Request, Response } from "express";
import youtubeService from "../utils/youtubeService";
import { prisma } from "../Connection/Prisma";
import { PlatformType } from "@prisma/client";

async function cleanOldHistory(userId: string, limit: number) {
    const history = await prisma.history.findMany({ 
        where: { userId }, 
        orderBy: { watchedAt: 'desc' }, 
        skip: limit, 
        take: 1, 
        select: { watchedAt: true } 
    });
    if (history.length > 0) {
        await prisma.history.deleteMany({ 
            where: { 
                userId, 
                watchedAt: { lt: history[0].watchedAt } 
            } 
        });
    }
}

export const saveHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const { videoId, platform, progress, duration, title, thumbnail, channelName } = req.body;

        if (!videoId || !platform) {
            res.status(400).json({ success: false, message: "videoId and platform are required" });
            return;
        }

        if (platform !== "local" && platform !== "youtube") {
            res.status(400).json({ success: false, message: 'platform must be "local" or "youtube"' });
            return;
        }

        const MIN_WATCH_TIME = 5;
        if ((progress ?? 0) < MIN_WATCH_TIME) {
            res.status(200).json({ success: true, message: "Video watched for less than 5 seconds, not saved to history" });
            return;
        }

        let videoData: { title: string; thumbnail: string; channelName: string; uploadedById?: string; duration: number } = {
            title: "", thumbnail: "", channelName: "", duration: 0
        };

        if (platform === "local") {
            const video = await prisma.video.findUnique({
                where: { id: videoId },
                include: { user: true }
            });

            if (!video) {
                res.status(404).json({ success: false, message: "Video not found" });
                return;
            }

            videoData = {
                title: video.title,
                thumbnail: video.thumbnail,
                channelName: video.user?.channelName ?? "Unknown",
                uploadedById: video.userId,
                duration: duration ?? 0,
            };
        } else {
            if (title && thumbnail && channelName) {
                videoData = { title, thumbnail, channelName, duration: duration ?? 0 };
            } else {
                try {
                    const ytMetadata = await youtubeService.getVideoMetadata(videoId);
                    videoData = {
                        title: ytMetadata.title,
                        thumbnail: ytMetadata.thumbnail || "",
                        channelName: ytMetadata.channelName,
                        duration: ytMetadata.duration,
                    };
                } catch (error) {
                    console.error(error);
                    videoData = {
                        title: title ?? "YouTube Video",
                        thumbnail: thumbnail ?? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                        channelName: channelName ?? "Unknown",
                        duration: duration ?? 0,
                    };
                }
            }
        }

        const completed = (progress ?? 0) >= videoData.duration * 0.9;

        const historyEntry = await prisma.history.upsert({
            where: {
                userId_videoId_platform: {
                    userId,
                    videoId: String(videoId),
                    platform: platform as PlatformType
                }
            },
            update: {
                ...videoData,
                progress: progress ?? 0,
                watchedAt: new Date(),
                completed,
                watchCount: { increment: 1 }
            },
            create: {
                userId,
                videoId: String(videoId),
                platform: platform as PlatformType,
                ...videoData,
                progress: progress ?? 0,
                firstWatchedAt: new Date(),
                watchedAt: new Date(),
                completed,
                watchCount: 1
            }
        });

        await cleanOldHistory(userId, 100);

        res.status(200).json({
            success: true,
            message: "History saved successfully",
            data: historyEntry,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to save history", error: error instanceof Error ? error.message : "Unknown error" });
    }
};

export const getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const page = Number.parseInt(req.query.page as string, 10) || 1;
        const limit = Number.parseInt(req.query.limit as string, 10) || 20;
        const platformFilter = req.query.platform as "local" | "youtube" | undefined;

        const maxLimit = 100;
        const validLimit = Math.min(limit, maxLimit);
        const skip = (page - 1) * validLimit;

        const whereCondition: any = { userId };
        if (platformFilter && (platformFilter === "local" || platformFilter === "youtube")) {
            whereCondition.platform = platformFilter;
        }

        const [history, totalCount] = await Promise.all([
            prisma.history.findMany({
                where: whereCondition,
                orderBy: { watchedAt: "desc" },
                skip,
                take: validLimit,
                include: { uploadedBy: { select: { channelName: true, profilePic: true } } }
            }),
            prisma.history.count({ where: whereCondition })
        ]);

        const historyWithMeta = history.map(item => ({
            ...item,
            watchPercentage: item.duration > 0 ? Math.min(100, Math.round((item.progress / item.duration) * 100)) : 0,
        }));

        res.status(200).json({
            success: true,
            data: historyWithMeta,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / validLimit),
                totalItems: totalCount,
                itemsPerPage: validLimit,
                hasMore: skip + history.length < totalCount,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch history", error: error instanceof Error ? error.message : "Unknown error" });
    }
};

export const getHistoryAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        
        // Fetch all history entries for this user (capped at 100 anyway)
        const historyData = await prisma.history.findMany({
            where: { userId },
            include: { 
                // We need the category from the video if it's a local video
                user: { select: { videos: { select: { id: true, category: true } } } }
            }
        });

        // Initialize aggregations
        let totalWatchTime = 0;
        let completedCount = 0;
        
        const platformAgg: Record<string, { watchTime: number; count: number }> = {};
        const videoAgg: Record<string, { _id: any; watchTime: number; count: number }> = {};
        const categoryAgg: Record<string, { watchTime: number; count: number }> = {};
        const channelAgg: Record<string, { watchTime: number; count: number }> = {};
        const durationAgg: Record<string, { watchTime: number; count: number }> = {};
        const languageAgg: Record<string, { watchTime: number; count: number }> = {};
        
        const dailyAgg: Record<string, { watchTime: number; count: number }> = {};
        const weeklyAgg: Record<string, { watchTime: number; count: number }> = {};
        const peakHoursAgg: Record<number, { watchTime: number; count: number }> = {};

        for (const item of historyData) {
            const watchTime = item.duration > 0 ? Math.min(item.progress, item.duration) : item.progress;
            
            totalWatchTime += watchTime;
            if (item.completed) completedCount++;

            // Platform
            if (!platformAgg[item.platform]) platformAgg[item.platform] = { watchTime: 0, count: 0 };
            platformAgg[item.platform].watchTime += watchTime;
            platformAgg[item.platform].count++;

            // Per Video
            const vKey = `${item.platform}-${item.videoId}`;
            if (!videoAgg[vKey]) videoAgg[vKey] = { 
                _id: { videoId: item.videoId, platform: item.platform, title: item.title, thumbnail: item.thumbnail, channelName: item.channelName }, 
                watchTime: 0, count: 0 
            };
            videoAgg[vKey].watchTime += watchTime;
            videoAgg[vKey].count++;

            // Category (if local, check if video exists, otherwise YouTube)
            let category = "YouTube";
            if (item.platform === "local") {
                const vid = item.user?.videos.find(v => v.id === item.videoId);
                category = vid ? vid.category : "Unknown";
            }
            if (!categoryAgg[category]) categoryAgg[category] = { watchTime: 0, count: 0 };
            categoryAgg[category].watchTime += watchTime;
            categoryAgg[category].count++;

            // Channel
            if (!channelAgg[item.channelName]) channelAgg[item.channelName] = { watchTime: 0, count: 0 };
            channelAgg[item.channelName].watchTime += watchTime;
            channelAgg[item.channelName].count++;

            // Duration Bucket
            let durationBucket = "Unknown";
            if (item.duration <= 300) durationBucket = "Short (<5 min)";
            else if (item.duration <= 1200) durationBucket = "Medium (5-20 min)";
            else durationBucket = "Long (>20 min)";
            
            if (!durationAgg[durationBucket]) durationAgg[durationBucket] = { watchTime: 0, count: 0 };
            durationAgg[durationBucket].watchTime += watchTime;
            durationAgg[durationBucket].count++;

            // Language
            const isHindi = /[ऀ-ॿ]/.test(item.title);
            const language = isHindi ? "Hindi / Regional" : "English / Other";
            if (!languageAgg[language]) languageAgg[language] = { watchTime: 0, count: 0 };
            languageAgg[language].watchTime += watchTime;
            languageAgg[language].count++;

            // Dates
            const dateObj = new Date(item.watchedAt);
            const dayStr = dateObj.toISOString().split('T')[0];
            
            if (!dailyAgg[dayStr]) dailyAgg[dayStr] = { watchTime: 0, count: 0 };
            dailyAgg[dayStr].watchTime += watchTime;
            dailyAgg[dayStr].count++;

            // Week approx
            const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
            const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
            const weekStr = `${d.getUTCFullYear()}-W${weekNo}`;

            if (!weeklyAgg[weekStr]) weeklyAgg[weekStr] = { watchTime: 0, count: 0 };
            weeklyAgg[weekStr].watchTime += watchTime;
            weeklyAgg[weekStr].count++;

            // Peak hours
            const hour = dateObj.getHours();
            if (!peakHoursAgg[hour]) peakHoursAgg[hour] = { watchTime: 0, count: 0 };
            peakHoursAgg[hour].watchTime += watchTime;
            peakHoursAgg[hour].count++;
        }

        const toSortedArray = (obj: any, keyMap: (k: string, v: any) => any) => 
            Object.entries(obj).map(([k, v]) => keyMap(k, v)).sort((a: any, b: any) => b.watchTime - a.watchTime).slice(0, 20);

        res.status(200).json({
            success: true,
            data: {
                totals: {
                    totalWatchTime,
                    totalEntries: historyData.length,
                    completedCount,
                    averageWatchTime: historyData.length ? totalWatchTime / historyData.length : 0
                },
                platformBreakdown: toSortedArray(platformAgg, (k, v) => ({ _id: k, ...v })),
                perVideo: Object.values(videoAgg).sort((a, b) => b.watchTime - a.watchTime).slice(0, 20),
                perCategory: toSortedArray(categoryAgg, (k, v) => ({ _id: k, ...v })),
                perChannel: toSortedArray(channelAgg, (k, v) => ({ _id: k, ...v })),
                durationBuckets: toSortedArray(durationAgg, (k, v) => ({ _id: k, ...v })),
                languageBreakdown: toSortedArray(languageAgg, (k, v) => ({ _id: k, ...v })),
                daily: Object.entries(dailyAgg).map(([k, v]) => ({ _id: k, ...v as any })).sort((a, b) => a._id.localeCompare(b._id)).slice(0, 30),
                weekly: Object.entries(weeklyAgg).map(([k, v]) => ({ _id: k, ...v as any })).sort((a, b) => a._id.localeCompare(b._id)).slice(0, 12),
                peakHours: Object.entries(peakHoursAgg).map(([k, v]) => ({ _id: parseInt(k), ...v as any })).sort((a, b) => b.watchTime - a.watchTime).slice(0, 24)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch analytics", error: error instanceof Error ? error.message : "Unknown error" });
    }
};

export const clearHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const result = await prisma.history.deleteMany({ where: { userId } });
        res.status(200).json({ success: true, message: "History cleared successfully", deletedCount: result.count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to clear history", error: error instanceof Error ? error.message : "Unknown error" });
    }
};

export const deleteHistoryItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const videoId = req.params.videoId as string;
        const platform = req.query.platform as "local" | "youtube" | undefined;

        if (!platform || (platform !== "local" && platform !== "youtube")) {
            res.status(400).json({ success: false, message: "Valid platform query parameter is required (local or youtube)" });
            return;
        }

        const result = await prisma.history.delete({
            where: {
                userId_videoId_platform: {
                    userId,
                    videoId,
                    platform
                }
            }
        });

        res.status(200).json({ success: true, message: "History item deleted successfully", data: result });
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, message: "History item not found" });
            return;
        }
        res.status(500).json({ success: false, message: "Failed to delete history item", error: error instanceof Error ? error.message : "Unknown error" });
    }
};

export const getHistoryItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user.id;
        const videoId = req.params.videoId as string;
        const platform = req.query.platform as "local" | "youtube" | undefined;

        if (!platform || (platform !== "local" && platform !== "youtube")) {
            res.status(400).json({ success: false, message: "Valid platform query parameter is required (local or youtube)" });
            return;
        }

        const historyItem = await prisma.history.findUnique({
            where: {
                userId_videoId_platform: {
                    userId,
                    videoId,
                    platform
                }
            },
            include: { uploadedBy: { select: { channelName: true, profilePic: true } } }
        });

        if (!historyItem) {
            res.status(404).json({ success: false, message: "No history found for this video" });
            return;
        }

        res.status(200).json({ success: true, data: historyItem });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch history item", error: error instanceof Error ? error.message : "Unknown error" });
    }
};

export const getYouTubeMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
        const videoId = req.params.videoId as string;
        if (!youtubeService.isValidVideoId(videoId)) {
            res.status(400).json({ success: false, message: "Invalid YouTube video ID" });
            return;
        }

        const metadata = await youtubeService.getVideoMetadata(videoId);
        res.status(200).json({ success: true, data: metadata });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to fetch YouTube metadata" });
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