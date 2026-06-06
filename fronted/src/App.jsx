import { useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function App() {
  const [username, setUsername] = useState(''); 
  const [userData, setUserData] = useState(null);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); 

  const COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6610f2', '#e83e8c', '#fd7e14'];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Pehle koi handle toh daalo!");
      return;
    }

    setLoading(true);
    setError('');
    setUserData(null);
    setRatingHistory([]);
    setSubmissions([]);
    setAnalysis(null);

    try {
      const BACKEND_URL = 'http://localhost:5000';

      const [userRes, ratingRes, subRes, analysisRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/test?handle=${username}`),
        axios.get(`${BACKEND_URL}/api/rating?handle=${username}`),
        axios.get(`${BACKEND_URL}/api/submissions?handle=${username}`),
        axios.get(`${BACKEND_URL}/api/analysis?handle=${username}`)
      ]);

      if (userRes.data.success) setUserData(userRes.data.userProfile);
      if (ratingRes.data.success) setRatingHistory(ratingRes.data.ratingHistory);
      if (subRes.data.success) setSubmissions(subRes.data.Submissions);
      if (analysisRes.data.success) setAnalysis(analysisRes.data);

    } catch (err) {
      console.log(err);
      setUserData(null);
      setRatingHistory([]);
      setSubmissions([]);
      setAnalysis(null);
      
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("User nahi mila ya backend server band hai!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif', backgroundColor: '#121212', color: '#fff', minHeight: '100vh', paddingBottom: '50px' }}>
      <h1>Cp Analyzer Frontend</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Enter Codeforces Handle (e.g., tourist)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          style={{ 
            padding: '12px', width: '280px', borderRadius: '6px', border: '1px solid #555', 
            marginRight: '10px', backgroundColor: '#222', color: '#fff', fontSize: '16px'
          }}
        />
        <button type="submit" disabled={loading} style={{ 
          padding: '12px 24px', borderRadius: '6px', background: '#007bff', 
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
        }}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {loading && (
        <div style={{ marginTop: '30px' }}>
          <div className="spinner" style={{
            border: '4px solid rgba(255,255,255,0.1)', width: '36px', height: '36px',
            borderRadius: '50%', borderLeftColor: '#007bff', animation: 'spin 1s linear infinite', margin: '0 auto'
          }}></div>
          <p style={{ color: '#aaa', marginTop: '10px' }}>Loading actual Codeforces data...</p>
          <style>{` @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `}</style>
        </div>
      )}

      {error && (
        <div style={{ margin: '20px auto', padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '6px', maxWidth: '500px', fontWeight: 'bold', border: '1px solid #f5c6cb' }}>
           {error}
        </div>
      )}

      {!loading && userData && (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
          
          <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #444', backgroundColor: '#1e1e1e', display: 'inline-block', borderRadius: '8px', minWidth: '300px' }}>
            <h2>Handle: {userData.handle}</h2>
            <p style={{ color: '#28a745', fontSize: '22px', fontWeight: 'bold' }}>Current Rating: {userData.rating || 'Unrated'}</p>
            <p style={{ fontSize: '18px', color: '#aaa' }}>Rank: {userData.rank || 'N/A'}</p>
          </div>

          {analysis && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginTop: '30px' }}>
              <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #444', padding: '20px', borderRadius: '8px', width: '200px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#aaa' }}>Total Solved</h4>
                <h2 style={{ margin: 0, color: '#28a745' }}>{analysis.stats.totalSolved}</h2>
              </div>
              <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #444', padding: '20px', borderRadius: '8px', width: '200px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#aaa' }}>Total Contests</h4>
                <h2 style={{ margin: 0, color: '#007bff' }}>{analysis.stats.totalContests}</h2>
              </div>
              <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #444', padding: '20px', borderRadius: '8px', width: '200px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#aaa' }}>Best Rank</h4>
                <h2 style={{ margin: 0, color: '#ffc107' }}>{analysis.stats.bestRank}</h2>
              </div>
              <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #444', padding: '20px', borderRadius: '8px', width: '200px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#aaa' }}>Worst Rank</h4>
                <h2 style={{ margin: 0, color: '#dc3545' }}>{analysis.stats.worstRank}</h2>
              </div>
            </div>
          )}

          {analysis && analysis.chartData.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: '40px', gap: '20px' }}>
              
              <div style={{ flex: '1 1 500px', backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #444' }}>
                <h3 style={{ marginBottom: '20px' }}>📊 Topic-Wise Solved Breakdown</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={analysis.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fill: '#fff', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#fff' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                      <Bar dataKey="value">
                        {analysis.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ flex: '1 1 400px', backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #444', textAlign: 'left' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#ffc107' }}>⚠️ Weak Topics (Needs Improvement)</h3>
                {analysis.weakTopics.length > 0 ? (
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {analysis.weakTopics.map((item, index) => (
                      <li key={index} style={{ padding: '12px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{item.tag}</span>
                        <span style={{ fontSize: '14px', color: '#dc3545' }}>
                          Wrong: <strong>{item.wrongCount}</strong> | Solved: <strong>{item.correctCount}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ textAlign: 'center', color: '#aaa' }}>Boht badiya! Koi major weak topic nahi mila.</p>
                )}
              </div>
            </div>
          )}
          {analysis && analysis.recommendations && analysis.recommendations.length > 0 && (
            <div style={{ marginTop: '50px', textAlign: 'left', maxWidth: '1000px', margin: '50px auto 0 auto' }}>
              <h3 style={{ textAlign: 'center', color: '#28a745', marginBottom: '25px', fontSize: '24px' }}>
                 Recommended Problems (Based on Weak Topics)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {analysis.recommendations.map((prob, index) => (
                  <div key={index} style={{ 
                    backgroundColor: '#1e1e1e', 
                    border: '1px solid #444', 
                    padding: '18px', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    <div>
                      <strong style={{ fontSize: '18px', color: '#fff' }}>{prob.name}</strong>
                      <span style={{ 
                        marginLeft: '12px', fontSize: '11px', backgroundColor: '#dc3545', 
                        padding: '4px 8px', borderRadius: '4px', color: '#fff', 
                        textTransform: 'uppercase', fontWeight: 'bold' 
                      }}>
                        {prob.tag}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <span style={{ color: '#ffc107', fontWeight: 'bold', fontSize: '16px' }}>
                        Rating: {prob.rating}
                      </span>
                      <a 
                        href={prob.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          backgroundColor: '#28a745', 
                          color: '#fff', 
                          textDecoration: 'none', 
                          padding: '10px 20px', 
                          borderRadius: '6px', 
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}
                      >
                        Solve Now 
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ratingHistory.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h3> Last 3 Contests History:</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                {ratingHistory.slice(-3).reverse().map((contest, index) => (
                  <div key={index} style={{ backgroundColor: '#1e1e1e', border: '1px solid #444', padding: '15px', width: '280px', borderRadius: '6px', textAlign: 'left' }}>
                    <strong style={{ color: '#007bff' }}>{contest.contestName}</strong> <br />
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#ccc' }}>
                      Rank: <span style={{ color: '#fff', fontWeight: 'bold' }}>{contest.rank}</span> | 
                      New Rating: <span style={{ color: '#28a745', fontWeight: 'bold' }}>{contest.newRating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submissions.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h3> Recent Submissions:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                {submissions.slice(0, 5).map((sub, index) => (
                  <div key={index} style={{ 
                    backgroundColor: sub.verdict === 'OK' ? 'rgba(40, 167, 69, 0.15)' : 'rgba(220, 53, 69, 0.15)', 
                    color: sub.verdict === 'OK' ? '#2eb85c' : '#e55353', 
                    border: `1px solid ${sub.verdict === 'OK' ? '#28a745' : '#dc3545'}`,
                    padding: '12px', width: '100%', maxWidth: '600px', borderRadius: '6px', textAlign: 'left'
                  }}>
                    <strong>{sub.problem.name}</strong> (Rating: {sub.problem.rating || 'N/A'}) <br />
                    <span style={{ fontSize: '14px', color: '#aaa' }}>Verdict: {sub.verdict} | Language: {sub.programmingLanguage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default App;