import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app">
      <div className="sidebar">
        <h2>AI Interview</h2>

        <button
          className={isActive("/dashboard") ? "active" : ""}
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>

        <button
          className={isActive("/interview") ? "active" : ""}
          onClick={() => navigate("/interview")}
        >
          Start Interview
        </button>

        <button
          className={isActive("/history") ? "active" : ""}
          onClick={() => navigate("/history")}
        >
          History
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="main">
        {children}
      </div>
    </div>
  );
}

export default Layout;