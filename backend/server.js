const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
const handleAxiosError = (error, handle) => {
    if (error.response && (error.response.status === 400 || error.response.status === 404)) {
        return {
            status: 404,
            message: `Codeforces par '${handle}' username nahi mila! Sahi naam daalo.`
        };
    }
    return {
        status: 500,
        message: "Codeforces server down hai ya responding nahi kar raha."
    };
};

app.get('/api/test', async (req, res) => {
    const handle = req.query.handle || 'tourist';
    try {
        const response = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
        res.json({ success: true, userProfile: response.data.result[0] });
    } catch (error) {
        const errDetail = handleAxiosError(error, handle);
        res.status(errDetail.status).json({ success: false, message: errDetail.message });
    }
});

app.get('/api/rating', async (req, res) => {
    const handle = req.query.handle || 'tourist';
    try {
        const response = await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`);
        res.json({ success: true, ratingHistory: response.data.result });
    } catch (error) {
        const errDetail = handleAxiosError(error, handle);
        res.status(errDetail.status).json({ success: false, message: errDetail.message });
    }
});

app.get('/api/submissions', async (req, res) => {
    const handle = req.query.handle || 'tourist';
    try {
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10`);
        res.json({ success: true, Submissions: response.data.result });
    } catch (error) {
        const errDetail = handleAxiosError(error, handle);
        res.status(errDetail.status).json({ success: false, message: errDetail.message });
    }
});

app.get('/api/analysis', async (req, res) => {
    const handle = req.query.handle || 'tourist';
    try {
        const [subRes, ratingRes, problemsetRes] = await Promise.all([
            axios.get(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=500`),
            axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`),
            axios.get(`https://codeforces.com/api/problemset.problems`)
        ]);

        const submissions = subRes.data.result;
        const ratings = ratingRes.data.result;
        const allProblems = problemsetRes.data.result.problems;

        let totalSolved = 0;
        const topicCounts = {};
        const wrongCounts = {};
        const solvedUniqueProblems = new Set();

        submissions.forEach(sub => {
            const problemId = `${sub.problem.contestId}-${sub.problem.index}`;
            const tags = sub.problem.tags || [];

            if (sub.verdict === 'OK') {
                if (!solvedUniqueProblems.has(problemId)) {
                    solvedUniqueProblems.add(problemId);
                    totalSolved++;
                    tags.forEach(tag => {
                        topicCounts[tag] = (topicCounts[tag] || 0) + 1;
                    });
                }
            } else {
                tags.forEach(tag => {
                    wrongCounts[tag] = (wrongCounts[tag] || 0) + 1;
                });
            }
        });

        const weakTopics = Object.keys(wrongCounts)
            .filter(tag => wrongCounts[tag] > (topicCounts[tag] || 0))
            .map(tag => ({
                tag,
                wrongCount: wrongCounts[tag],
                correctCount: topicCounts[tag] || 0
            }))
            .sort((a, b) => b.wrongCount - a.wrongCount)
            .slice(0, 5);

        const chartData = Object.keys(topicCounts).map(tag => ({
            name: tag,
            value: topicCounts[tag]
        })).sort((a, b) => b.value - a.value).slice(0, 8);

        let bestRank = Infinity;
        let worstRank = -Infinity;
        let totalContests = ratings.length;

        ratings.forEach(c => {
            if (c.rank < bestRank) bestRank = c.rank;
            if (c.rank > worstRank) worstRank = c.rank;
        });
        const currentRating = ratings.length > 0 ? ratings[ratings.length - 1].newRating : 1200;
        let recommendations = [];

        weakTopics.forEach(weak => {
            const matchingProblems = allProblems.filter(p => {
                const probId = `${p.contestId}-${p.index}`;
                const hasTag = p.tags && p.tags.includes(weak.tag);
                const isNotSolved = !solvedUniqueProblems.has(probId);
               
                const isRightDifficulty = p.rating ? (p.rating >= currentRating - 100 && p.rating <= currentRating + 200) : true;
                
                return hasTag && isNotSolved && isRightDifficulty;
            });

            matchingProblems.slice(0, 2).forEach(p => {
                recommendations.push({
                    tag: weak.tag,
                    name: p.name,
                    rating: p.rating || 'N/A',
                    link: `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`
                });
            });
        });

        res.json({
            success: true,
            stats: {
                totalSolved,
                totalContests,
                bestRank: bestRank === Infinity ? 'N/A' : bestRank,
                worstRank: worstRank === -Infinity ? 'N/A' : worstRank
            },
            chartData,
            weakTopics,
            recommendations: recommendations.slice(0, 6)
        });

    } catch (error) {
        const errDetail = handleAxiosError(error, handle);
        res.status(errDetail.status).json({ success: false, message: errDetail.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});