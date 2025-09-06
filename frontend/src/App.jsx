import React, { useState } from "react";
import QuizPage from "./components/QuizPage";

export default function App() {
  const [started, setStarted] = useState(false);
  const [userId, setUserId] = useState("user123");
  const [topic, setTopic] = useState("math");

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">AI Quiz App</h1>

      {!started ? (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter your user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Enter topic (e.g., math)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={() => setStarted(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Start Quiz
          </button>
        </div>
      ) : (
        <QuizPage
          userId={userId}
          topic={topic}
          onExit={() => setStarted(false)}
        />
      )}
    </div>
  );
}
