import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import DashboardPage from "./components/DashboardPage";
import QuizPage from "./components/QuizPage";
import HistoryDetail from "./components/HistoryDetail";
import { setAuthToken } from "./api";
import "./index.css";

// A simple router
const App = () => {
  const [route, setRoute] = useState({ name: 'login' });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Restore a logged-in session (user + JWT) from a previous visit.
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setAuthToken(storedToken);
      setCurrentUser(storedUser);
      setRoute({ name: 'dashboard' });
    }
  }, []);

  const handleLogin = (userId, token) => {
    setCurrentUser(userId);
    localStorage.setItem('currentUser', userId);
    localStorage.setItem('token', token);
    setAuthToken(token);
    setRoute({ name: 'dashboard' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setAuthToken(null);
    setRoute({ name: 'login' });
  };

  const renderContent = () => {
    switch (route.name) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'dashboard':
        return <DashboardPage userId={currentUser} onStartQuiz={(config) => setRoute({ name: 'quiz', ...config })} onViewHistory={(history) => setRoute({ name: 'history', history })} onLogout={handleLogout} />;
      case 'quiz':
        return <QuizPage userId={currentUser} course={route.course} topic={route.topic} numQuestions={route.numQuestions} onExit={() => setRoute({ name: 'dashboard' })} />;
      case 'history':
        return <HistoryDetail history={route.history} onBack={() => setRoute({ name: 'dashboard' })} />;
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  return <div className="app-container">{renderContent()}</div>;
};

export default App;

