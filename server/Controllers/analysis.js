const llmService = require('../Services/llmService');
const History = require('../Modals/history'); // Direct database access

const getAnalysis = async (req, res) => {
    console.log('getAnalysis called');
    const { userId } = req.params;
    console.log('User ID:', userId);

    try {
        // 1. Fetch recent history from DB directly instead of HTTP request
        const historyData = await History.find({ user: userId })
            .sort({ watchedAt: -1 })
            .limit(20)
            .lean();

        if (!historyData || historyData.length === 0) {
            console.log('No history data found for user.');
            return res.status(200).json({
                "topInterests": [],
                "learningPattern": "Not enough data",
                "consistency": "Not enough data",
                "engagementLevel": "Not enough data",
                "recommendedTopics": [],
                "summary": "No watch history found to analyze."
            });
        }

        // 2. Extract only useful fields for LLM
        const recentHistory = historyData.map(item => ({
            title: item.title,
            channelName: item.channelName,
            duration: item.duration,
            progress: item.progress,
            completed: item.completed,
            lastWatchedAt: item.watchedAt
        }));
        console.log('Processed Recent History:', recentHistory);

        // 3. Build a structured prompt for LLM
        const prompt = llmService.buildAnalysisPrompt(recentHistory);
        console.log('Generated LLM Prompt:', prompt); // Log the generated prompt

        // 4. Call LLM API
        console.log('Calling LLM Service...');
        const analysis = await llmService.getLLMAnalysis(prompt);
        console.log('Received LLM Analysis:', analysis); // Log the analysis from LLM

        // 5. Return structured JSON insights
        console.log('Sending analysis response.');
        res.json(analysis);

    } catch (error) {
        console.error('Error in getAnalysis:', error.message);
        // If LLM fails or any other error -> return fallback message
        if (error.response) {
            console.error('Error Response Data:', error.response.data);
            console.error('Error Response Status:', error.response.status);
            console.error('Error Response Headers:', error.response.headers);
             if (error.response.status === 401) {
                return res.status(401).json({ message: 'Unauthorized to fetch history.' });
            }
        } else if (error.request) {
            console.error('Error Request:', error.request);
        } else {
            console.error('General Error:', error);
        }
        res.status(500).json({ message: 'Failed to generate analysis. Please try again later.' });
    }
};

module.exports = {
    getAnalysis
};
