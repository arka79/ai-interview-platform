import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";

function Dashboard() {
  const [metrics, setMetrics] = useState({
    total: 0,
    average: 0,
    best: 0,
  });

 useEffect(() => {
  const fetchMetrics = async () => {
    try {
      const res = await API.get("/dashboard");

      setMetrics({
        total: res.data.total_interviews,
        average: res.data.average_score,
        best: res.data.best_score,
        completion: res.data.completion_rate,
      });
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  };

  fetchMetrics();
}, []);



  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome Back 👋</h1>
          <p>Your AI Interview Performance Overview</p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Total Interviews</h3>
            <p className="metric-value">{metrics.total}</p>
          </div>

          <div className="metric-card highlight">
            <h3>Average Score</h3>
            <p className="metric-value">{metrics.average}</p>
          </div>

          <div className="metric-card success">
            <h3>Best Score</h3>
            <p className="metric-value">{metrics.best}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
