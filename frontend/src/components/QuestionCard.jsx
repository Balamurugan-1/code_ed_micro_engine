import React from "react";

export default function QuestionCard({ question, onAnswer, selectedAnswer, correctAnswerIndex, isAnswered }) {
  if (!question) return null;

  const getButtonClass = (idx) => {
    if (!isAnswered) {
      return "bg-blue-500 hover:bg-blue-600";
    }
    if (idx === correctAnswerIndex) {
      return "bg-green-500"; 
    }
    if (idx === selectedAnswer) {
      return "bg-red-500"; 
    }
    return "bg-gray-400"; 
  };

  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">{question.text}</h2>
      <div className="flex flex-col gap-2">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            className={`px-4 py-2 text-white rounded ${getButtonClass(idx)} disabled:opacity-75`}
            onClick={() => onAnswer(idx)}
            disabled={isAnswered}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}