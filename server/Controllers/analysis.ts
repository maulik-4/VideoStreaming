import { Request, Response } from "express";

import llmService from "../Services/llmService";
import History from "../Modals/history";

export const getAnalysis = async (
    req: Request,
    res: Response
): Promise<void> => {
  

    const { userId } = req.params;


    try {
        const historyData = await History.find({
            user: userId,
        })
            .sort({
                watchedAt: -1,
            })
            .limit(20)
            .lean();

        if (historyData.length === 0) {
            res.status(200).json({
                topInterests: [],
                learningPattern: "Not enough data",
                consistency: "Not enough data",
                engagementLevel: "Not enough data",
                recommendedTopics: [],
                summary:
                    "No watch history found to analyze.",
            });
            return;
        }

        const recentHistory = historyData.map(
            (item) => ({
                title: item.title,
                channelName: item.channelName,
                duration: item.duration,
                progress: item.progress,
                completed: item.completed,
                lastWatchedAt: item.watchedAt,
            })
        );

     

        const prompt =
            llmService.buildAnalysisPrompt(
                recentHistory
            );

       
  

        const analysis =
            await llmService.getLLMAnalysis(
                prompt
            );

       

       

        res.status(200).json(analysis);
    } catch (error) {
        console.error(
            "Error in getAnalysis:",
            error
        );

        if (
            error &&
            typeof error === "object" &&
            "response" in error
        ) {
            const axiosError = error as {
                response?: {
                    status: number;
                    data: unknown;
                    headers: unknown;
                };
            };

            if (axiosError.response) {
                console.error(
                    "Error Response Data:",
                    axiosError.response.data
                );

                console.error(
                    "Error Response Status:",
                    axiosError.response.status
                );

                console.error(
                    "Error Response Headers:",
                    axiosError.response.headers
                );

                if (
                    axiosError.response
                        .status === 401
                ) {
                    res.status(401).json({
                        message:
                            "Unauthorized to fetch history.",
                    });
                    return;
                }
            }
        } else if (
            error &&
            typeof error === "object" &&
            "request" in error
        ) {
            console.error(
                "Error Request:",
                (error as { request: unknown })
                    .request
            );
        } else {
            console.error(
                "General Error:",
                error
            );
        }

        res.status(500).json({
            message:
                "Failed to generate analysis. Please try again later.",
        });
    }
};

export default {
    getAnalysis,
};