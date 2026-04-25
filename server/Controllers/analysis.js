const axios = require('axios');
const llmService = require('../Services/llmService');

const getAnalysis = async (req, res) => {
    const { userId } = req.params;
    const port = process.env.PORT || 5000;
    const historyApiUrl = `http://localhost:${port}/api/history/${userId}`;

    try {
        // 1. Fetch data from existing history API
        const historyResponse = await axios.get(historyApiUrl, {
            headers: {
                'Authorization': req.headers.authorization
            }
        });

        const historyData = historyResponse.data;

        if (!historyData || !historyData.history || historyData.history.length === 0) {
            return res.status(200).json({
                "topInterests": [],
                "learningPattern": "Not enough data",
                "consistency": "Not enough data",
                "engagementLevel": "Not enough data",
                "recommendedTopics": [],
                "summary": "No watch history found to analyze."
            });
        }

        // 2. Extract only useful fields (limit to 20–30 items max)
        const recentHistory = historyData.history.slice(0, 20).map(item => ({
            title: item.title,
            channelName: item.channelName,
            duration: item.duration,
            progress: item.progress,
            completed: item.completed,
            lastWatchedAt: item.lastWatchedAt
        }));

        // 3. Build a structured prompt for LLM
        const prompt = llmService.buildAnalysisPrompt(recentHistory);

        // 4. Call LLM API
        const analysis = await llmService.getLLMAnalysis(prompt);

        // 5. Return structured JSON insights
        res.json(analysis);

    } catch (error) {
        console.error('Error getting analysis:', error);
        // If LLM fails or any other error -> return fallback message
        if (error.response && error.response.status === 401) {
             return res.status(401).json({ message: 'Unauthorized to fetch history.' });
        }
        res.status(500).json({ message: 'Failed to generate analysis. Please try again later.' });
    }
};

module.exports = {
    getAnalysis
};
