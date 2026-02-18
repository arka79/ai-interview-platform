import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";

function History() {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API.get("/interview/history");
        setQuestions(res.data.questions || []);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };
    fetchHistory();
  }, []);

  return (
    <Layout>
      <div className="history-page">
        <h1 className="history-title">Interview History</h1>

        {questions.length === 0 ? (
          <p className="empty-msg">No questions attempted yet.</p>
        ) : (
          <div className="history-scroll">
            {questions.map((item) => (
              <div key={item.id} className="card history-card">
                <h3>{item.question}</h3>
                <br />
                <p><strong>Score:</strong> {item.score}/10</p>
                <br />
                <p><strong>Feedback:</strong> {item.feedback}</p>
                <br />
                <p><strong>Improvements:</strong> {item.improvements}</p>
                <br />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default History;