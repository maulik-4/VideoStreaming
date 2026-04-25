import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig'; // Assuming you have an axios instance with base config

const Analysis = () => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?._id;

    useEffect(() => {
        if (!userId) {
            setError('You must be logged in to view your analysis.');
            setLoading(false);
            return;
        }

        const fetchAnalysis = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/analysis/${userId}`);
                console.log('AI Response:', response.data);
                setAnalysis(response.data);
                setError(null);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch analysis.');
                setAnalysis(null);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [userId]);

    if (loading) {
        return <div className="text-center mt-8">Loading analysis...</div>;
    }

    if (error) {
        return <div className="text-center mt-8 text-red-500">{error}</div>;
    }

    if (!analysis) {
        return <div className="text-center mt-8">No analysis data available.</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold mb-6">Your Watch History Analysis</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Summary</h2>
                    <p className="text-gray-600 dark:text-gray-300">{analysis.summary}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Top Interests</h2>
                    <ul className="list-disc list-inside space-y-2">
                        {analysis.topInterests.map((interest, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-300">{interest}</li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Learning Pattern</h2>
                    <p className="text-gray-600 dark:text-gray-300">{analysis.learningPattern}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Consistency</h2>
                    <p className="text-gray-600 dark:text-gray-300">{analysis.consistency}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Engagement Level</h2>
                    <p className="text-gray-600 dark:text-gray-300">{analysis.engagementLevel}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Recommended Topics</h2>
                     <ul className="list-disc list-inside space-y-2">
                        {analysis.recommendedTopics.map((topic, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-300">{topic}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Analysis;
