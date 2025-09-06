import React from "react";

export default function ResultPage({ progress, onRestart }) {
  return (
    <div className="p-6 bg-white shadow-md rounded-lg text-center">
      <h2 className="text-2xl font-bold mb-4">Quiz Completed 🎉</h2>

      <p className="text-lg mb-2">
        <strong>Score:</strong> {progress.score}
      </p>
      <p className="text-lg mb-2">
        <strong>Questions Answered:</strong> {progress.answered}
      </p>
      <p className="text-lg mb-2">
        <strong>Final Level:</strong> {progress.level}
      </p>

      <button
        onClick={onRestart}
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Restart Quiz
      </button>
    </div>
  );
}
