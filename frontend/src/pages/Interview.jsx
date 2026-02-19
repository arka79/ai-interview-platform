import React, { useState, useEffect, useRef } from "react";
import API from "../services/api";

function Interview() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const timerRef = useRef(null);
  const hasSubmitted = useRef(false);
  const recognitionRef = useRef(null);

  /* ===============================
     FETCH QUESTIONS
  =============================== */


useEffect(() => {
  const fetchQuestions = async () => {
    const res = await API.post("/interview/start", {
      role: "Backend Developer",
      difficulty: "Medium",
    });

    setQuestions(res.data.questions);
   setSessionId(res.data.sessionId);
   setLoading(false);

  };

  fetchQuestions();
}, []);


  /* ===============================
     TIMER
  =============================== */
  useEffect(() => {
    if (loading || result) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1 && !hasSubmitted.current) {
          clearInterval(timerRef.current);
          handleSubmitAll();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, result]);

  /* ===============================
     VOICE RECOGNITION
  =============================== */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      const questionId = questions[currentIndex]?.id || currentIndex;

      // ✅ Append instead of overwrite
      setAnswers((prev) => ({
        ...prev,
        [questionId]: (prev[questionId] || "") + transcript,
      }));
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, [currentIndex, questions]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  /* ===============================
     FORMAT TIMER
  =============================== */
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  /* ===============================
     HANDLE ANSWER CHANGE
  =============================== */
  const handleAnswerChange = (value) => {
    const questionId = questions[currentIndex]?.id || currentIndex;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  /* ===============================
     SUBMIT ALL
  =============================== */
  const handleSubmitAll = async () => {
  if (hasSubmitted.current || submitting) return;

  try {
    stopListening(); // stop mic before submit
    hasSubmitted.current = true;
    setSubmitting(true);

    // ✅ Convert answers object → structured array
    const formattedAnswers = questions.map((q) => ({
      question: q.question,
      answer: answers[q.id] || "",
    }));

    const res = await API.post("/interview/submit", {
      sessionId,
      answers: formattedAnswers,
    });

    setResult(res.data);

  } catch (err) {
    console.error("Submission failed:", err);
  } finally {
    setSubmitting(false);
  }
};


  /* ===============================
     RENDER STATES
  =============================== */

  if (loading) {
    return (
      <div className="exam-container">
        <h2>Loading questions...</h2>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="exam-container">
        <h2>No questions available.</h2>
      </div>
    );
  }

  if (result) {
    return (
      <div className="exam-container">
        <h2>Interview Completed</h2>
        <h3>Average Score: {result.average}/10</h3>

        {result.details?.map((item, index) => (
          <div key={index} className="card">
            <h4>Question {index + 1}</h4>
            <p><strong>Score:</strong> {item.score}/10</p>
            <p><strong>Feedback:</strong> {item.feedback}</p>
            <p><strong>Improvements:</strong> {item.improvements}</p>
          </div>
        ))}
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const questionId = currentQuestion?.id || currentIndex;

  /* ===============================
     MAIN UI
  =============================== */

  return (
    <div className="exam-container">
      <div className="exam-header">
        <h2>AI Voice Interview</h2>
        <div className="timer">{formatTime()}</div>
      </div>

      <div className="progress-bar">
        <div
          className="progress"
          style={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="question-box">
        <h3>Question {currentIndex + 1}</h3>
        <p>{currentQuestion?.question || currentQuestion}</p>

        <div className="voice-answer-box">
          {answers[questionId] || "Your speech will appear here..."}
        </div>

        <div className="voice-controls">
          {!isListening ? (
            <button onClick={startListening}>🎤 Start Speaking</button>
          ) : (
            <button onClick={stopListening}>⏹ Stop</button>
          )}
        </div>

        <textarea
          value={answers[questionId] || ""}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="Or type your answer here..."
          style={{ marginTop: "15px" }}
        />
      </div>

      <div className="exam-footer">
        <button
          disabled={currentIndex === 0}
          onClick={() => {
            stopListening();
            setCurrentIndex((prev) => prev - 1);
          }}
        >
          Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button onClick={handleSubmitAll} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit All"}
          </button>
        ) : (
          <button
            onClick={() => {
              stopListening();
              setCurrentIndex((prev) =>
                prev < questions.length - 1 ? prev + 1 : prev
              );
            }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default Interview;
