import axios, { AxiosError } from "axios";

type YouTubeMetadata = {
    videoId: string;
    title: string;
    thumbnail?: string;
    channelName: string;
    channelId: string;
    duration: number;
    publishedAt: string;
    description?: string;
    viewCount: number;
};

class YouTubeService {
    private readonly apiKey?: string;

    private readonly baseUrl =
        "https://www.googleapis.com/youtube/v3";

    constructor() {
        this.apiKey =
            process.env.YOUTUBE_API_KEY;
    }

    async getVideoMetadata(
        videoId: string
    ): Promise<YouTubeMetadata> {
        if (!this.apiKey) {
            throw new Error(
                "YouTube API key not configured"
            );
        }

        try {
            const response = await axios.get(
                `${this.baseUrl}/videos`,
                {
                    params: {
                        part: "snippet,contentDetails,statistics",
                        id: videoId,
                        key: this.apiKey,
                    },
                    timeout: 5000,
                }
            );

            const items = response.data.items;

            if (
                !items ||
                items.length === 0
            ) {
                throw new Error(
                    "Video not found or unavailable"
                );
            }

            const video = items[0];
            const snippet = video.snippet;
            const contentDetails =
                video.contentDetails;

            const duration =
                this.parseDuration(
                    contentDetails.duration
                );

            return {
                videoId: video.id,
                title: snippet.title,

                thumbnail:
                    snippet.thumbnails?.high
                        ?.url ??
                    snippet.thumbnails?.medium
                        ?.url ??
                    snippet.thumbnails
                        ?.default?.url,

                channelName:
                    snippet.channelTitle,

                channelId:
                    snippet.channelId,

                duration,

                publishedAt:
                    snippet.publishedAt,

                description:
                    snippet.description?.substring(
                        0,
                        200
                    ),

                viewCount:
                    Number.parseInt(
                        video.statistics
                            ?.viewCount ?? "0",
                        10
                    ),
            };
        } catch (error) {
            const axiosError =
                error as AxiosError;

            if (
                axiosError.response
                    ?.status === 403
            ) {
                throw new Error(
                    "YouTube API quota exceeded or invalid API key"
                );
            }

            if (
                axiosError.response
                    ?.status === 404
            ) {
                throw new Error(
                    "Video not found"
                );
            }

            console.error(
                "YouTube API Error:",
                error
            );

            throw new Error(
                "Failed to fetch YouTube video metadata"
            );
        }
    }

    parseDuration(
        duration: string
    ): number {
        const match = duration.match(
            /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
        );

        if (!match) {
            return 0;
        }

        const hours = Number.parseInt(
            match[1] ?? "0",
            10
        );

        const minutes =
            Number.parseInt(
                match[2] ?? "0",
                10
            );

        const seconds =
            Number.parseInt(
                match[3] ?? "0",
                10
            );

        return (
            hours * 3600 +
            minutes * 60 +
            seconds
        );
    }

    isValidVideoId(
        videoId: string
    ): boolean {
        return /^[a-zA-Z0-9_-]{11}$/.test(
            videoId
        );
    }

    extractVideoId(
        url: string
    ): string | null {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /^[a-zA-Z0-9_-]{11}$/,
        ];

        for (const pattern of patterns) {
            const match =
                url.match(pattern);

            if (match) {
                return (
                    match[1] ?? match[0]
                );
            }
        }

        return null;
    }
}

export default new YouTubeService();