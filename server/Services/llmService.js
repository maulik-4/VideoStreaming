const Groq = require('groq-sdk');

const getLLMAnalysis = async (prompt) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not set in environment variables.');
    }

    const groq = new Groq({ apiKey });

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are a user behavior analyst. Your task is to analyze user watch history and provide structured insights in JSON format.
                    
                    Rules:
                    * Identify top interests based on video titles and channel names.
                    * Detect the user's learning pattern (e.g., binge-watching, consistent learning, random exploration).
                    * Evaluate viewing consistency using the timestamps of watched videos.
                    * Evaluate user engagement based on video progress and completion rates.
                    * Suggest 3–5 relevant topics for the user to explore next.
                    * Keep the output concise and to the point.
                    * You MUST output ONLY a valid JSON object. Do not include any extra text, explanations, or markdown formatting.
                    
                    The JSON output must follow this exact structure:
                    {
                      "topInterests": [],
                      "learningPattern": "",
                      "consistency": "",
                      "engagementLevel": "",
                      "recommendedTopics": [],
                      "summary": ""
                    }`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama3-8b-8192',
            response_format: { type: 'json_object' },
        });

        // Clean and parse LLM JSON response safely
        const rawContent = chatCompletion.choices[0].message.content;
        return JSON.parse(rawContent);

    } catch (error) {
        console.error('Error calling LLM API:', error);
        throw new Error('Failed to get analysis from LLM.');
    }
};

const buildAnalysisPrompt = (history) => {
    const history_json = JSON.stringify(history, null, 2);
    return `Analyze this watch history data:

${history_json}
`;
};

module.exports = {
    getLLMAnalysis,
    buildAnalysisPrompt
};
