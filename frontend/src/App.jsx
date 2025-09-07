import React, { useState, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import DashboardPage from "./components/DashboardPage";
import QuizPage from "./components/QuizPage";
import HistoryDetail from "./components/HistoryDetail";
import "./index.css";

// A simple router
const App = () => {
  const [route, setRoute] = useState({ name: 'login' });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in from a previous session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(storedUser);
      setRoute({ name: 'dashboard' });
    }
  }, []);

  const handleLogin = (userId) => {
    setCurrentUser(userId);
    localStorage.setItem('currentUser', userId);
    setRoute({ name: 'dashboard' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
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

