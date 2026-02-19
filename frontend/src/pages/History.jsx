import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import API from "../services/api";

function History() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get("/interview/history");

        // normalize several possible response shapes from the backend
        // - { questions: [...] }
        // - { history: [...] }
        // - an array directly
        // - { data: [...] } (unlikely)
        const payload = res?.data;

        let items = [];

        if (!payload) {
          items = [];
        } else if (Array.isArray(payload)) {
          items = payload;
        } else if (Array.isArray(payload.questions)) {
          items = payload.questions;
        } else if (Array.isArray(payload.history)) {
          items = payload.history;
        } else if (Array.isArray(payload.interviews)) {
          items = payload.interviews;
        } else if (Array.isArray(payload.data)) {
          items = payload.data;
        } else {
          // try to detect a single-object wrapper that contains an array
          const maybeArray = Object.values(payload).find((v) => Array.isArray(v));
          items = Array.isArray(maybeArray) ? maybeArray : [];
        }

        setQuestions(items || []);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("Failed to load interview history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <Layout>
      <div className="history-page">
        <h1 className="history-title">Interview History</h1>

        {loading ? (
          <p className="empty-msg">Loading...</p>
        ) : error ? (
          <p className="empty-msg">{error}</p>
        ) : questions.length === 0 ? (
          <p className="empty-msg">No questions attempted yet.</p>
        ) : (
          <div className="history-scroll">
            {questions.map((item, idx) => (
              <div
                key={item.id ?? item.question ?? idx}
                className="card history-card"
              >
                <h3>{item.question ?? item.question_text ?? `Question ${idx + 1}`}</h3>

                <p>
                  <strong>Score:</strong> {item.score ?? item.total_score ?? "-"}/10
                </p>

                <p>
                  <strong>Feedback:</strong> {item.feedback ?? "No feedback"}
                </p>

                <p>
                  <strong>Improvements:</strong> {item.improvements ?? "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default History;