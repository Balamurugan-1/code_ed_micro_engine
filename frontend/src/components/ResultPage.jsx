import React from "react";

export default function ResultPage({ progress, questionHistory, onRestart }) {
  const decodeHTML = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg text-center">
      <h2 className="text-2xl font-bold mb-4">Quiz Completed 🎉</h2>

      <div className="text-left mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">Final Summary</h3>
        <p className="text-lg">
          <strong>Final Score:</strong> {Math.round(progress.score)}
        </p>
        <p className="text-lg">
          <strong>Questions Answered:</strong> {progress.answered}
        </p>
        <p className="text-lg">
          <strong>Final Level:</strong> {progress.level}
        </p>
      </div>

      <div className="text-left">
          <h3 className="text-xl font-semibold mb-4">Review Your Answers</h3>
          {questionHistory && questionHistory.map((q, index) => (
            <div key={index} className={`mb-4 p-3 rounded-lg ${q.is_correct ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
              <p className="font-bold">{index + 1}. {decodeHTML(q.text)}</p>
              <p className="text-sm">Your answer: <span className="font-semibold">{decodeHTML(q.options[q.user_answer_index])}</span></p>
              {!q.is_correct && (
                <p className="text-sm">Correct answer: <span className="font-semibold">{decodeHTML(q.options[q.correct_index])}</span></p>
              )}
            </div>
          ))}
      </div>


      <button
        onClick={onRestart}
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Restart Quiz
      </button>
    </div>
  );
}