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
                    content: `
You are an expert user behavior analyst for a video streaming platform.

Your job is to analyze a user's watch history and generate personalized insights.

Use the following information from each video:
- title
- channelName
- duration
- progress
- completed
- lastWatchedAt

Analyze the data and determine:

1. topInterests
- Identify the user's main interests based on recurring topics in titles and channel names.
- Return 3-5 interests.
- Do not repeat similar interests.

2. learningPattern
Choose the best description based on the data, such as:
- Consistent Learner
- Binge Learner
- Casual Explorer
- Topic Hopper
- Deep Researcher
- Entertainment Focused
Also explain WHY in one sentence.

3. consistency
Analyze watch timestamps and describe how regularly the user watches videos.
Examples:
- Daily learner
- Weekend learner
- Irregular usage
- Active recently
- Inactive recently

4. engagementLevel
Evaluate using:
- completion rate
- watch percentage
- number of completed videos

Classify as:
- High
- Medium
- Low

Include one sentence explaining the reason.

5. recommendedTopics
Recommend exactly 5 topics the user is most likely interested in learning next.

Recommendations must be related to the user's watch history.

6. summary
Write a short personalized summary (2-3 sentences).

Rules:
- Base every conclusion ONLY on the supplied watch history.
- Never invent interests not supported by the data.
- Keep responses concise.
- Return ONLY valid JSON.
- No markdown.
- No explanation.
- No code fences.

Return EXACTLY this JSON schema:

{
  "topInterests": [],
  "learningPattern": "",
  "consistency": "",
  "engagementLevel": "",
  "recommendedTopics": [],
  "summary": ""
}
`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
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
