import React from "react";

export default function QuestionCard({ question, onAnswer }) {
  if (!question) return null;

  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">{question.text}</h2>
      <div className="flex flex-col gap-2">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => onAnswer(idx)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
