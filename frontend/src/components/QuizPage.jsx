import React, { useState, useEffect, useRef } from "react";
import QuestionCard from "./QuestionCard";
import ContentCard from "./ContentCard";
import ResultPage from "./ResultPage";
import { startQuiz, submitAnswer, finishQuiz } from "../api";

export default function QuizPage({ userId, course, topic, numQuestions, onExit }) {
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [learningContent, setLearningContent] = useState(null); 

  
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [elapsed, setElapsed] = useState(0);


  const initialized = useRef(false);
  // Timestamp of when the current question was first shown, used to measure
  // how long the learner took to answer.
  const questionShownAt = useRef(Date.now());

  // Reset the timer every time a new question is rendered, and tick a live
  // counter once per second while the learner is thinking. The counter
  // freezes once they answer so the final time stays visible.
  useEffect(() => {
    if (!question || isAnswered) return;
    questionShownAt.current = Date.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [question, isAnswered]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  useEffect(() => {

    if (initialized.current) {
      return;
    }
    initialized.current = true;

    async function initQuiz() {
      setLoading(true);
      try {
        const data = await startQuiz(userId, course, topic, numQuestions);
        setSessionId(data.session_id);
        setQuestion(data.question);
        setProgress(data.progress);
      } catch (err) {
        console.error("Failed to start quiz:", err);
      }
      setLoading(false);
    }

    initQuiz();
  }, [userId, course, topic, numQuestions]);

  async function handleAnswer(idx) {
    setIsAnswered(true);
    setSelectedAnswer(idx);

    const timeTaken = (Date.now() - questionShownAt.current) / 1000;
    try {
      const data = await submitAnswer(
        sessionId,
        idx,
        timeTaken,
        question.id
      );

      setCorrectAnswerIndex(data.correct_index);
      setExplanation(data.explanation);
      setProgress(data.progress);

      
      setTimeout(() => {
        if (data.progress.answered >= numQuestions) {
          setCompleted(true);
        } else {
         
          if (data.next_step && data.next_step.type === 'content') {
            setLearningContent(data.next_step.data);
            setQuestion(null); 
          } else {
            setQuestion(data.next_step.data); 
          
            setIsAnswered(false);
            setSelectedAnswer(null);
            setCorrectAnswerIndex(null);
            setExplanation("");
          }
        }
      }, 3000); 

    } catch (err) {
      console.error("Failed to submit answer:", err);
     
      setIsAnswered(false); 
      setSelectedAnswer(null);
    }
  }

 
  async function handleEndQuiz() {
    // Persist whatever progress exists so it shows up in history, then
    // show the results screen.
    if (sessionId) {
      try {
        await finishQuiz(sessionId);
      } catch (err) {
        console.error("Failed to finish quiz:", err);
      }
    }
    setCompleted(true);
  }

  function handleProceedFromContent() {
    setQuestion(learningContent.next_question);
    setLearningContent(null);
  
    setIsAnswered(false);
    setSelectedAnswer(null);
    setCorrectAnswerIndex(null);
    setExplanation("");
  }


  if (loading && !question) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Generating your personalized quiz...</p>
        <div className="loading-dots">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
      </div>
    );
  }

  if (completed) {
    return <ResultPage progress={progress} questionHistory={progress.question_history} course={course} topic={topic} onRestart={onExit} />;
  }

  // Running marks (percentage) derived from answers so far.
  const answeredQs = progress?.question_history || [];
  const answeredCount = answeredQs.length;
  const correctCount = answeredQs.filter((q) => q.is_correct).length;
  const runningPct = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  return (
    <div className="quiz-container">
      <div className="quiz-topbar">
        <button onClick={onExit} className="btn btn-ghost" style={{ padding: '10px 18px', minHeight: 'auto' }}>
          ← Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className={`quiz-timer ${!isAnswered && question ? 'is-running' : ''}`}>
            ⏱ {formatTime(elapsed)}
          </div>
          <div className="quiz-topic-chip">{topic}</div>
        </div>
      </div>

 
      {question && (
        <QuestionCard 
          question={question} 
          onAnswer={handleAnswer}
          isAnswered={isAnswered}
          selectedAnswer={selectedAnswer}
          correctAnswerIndex={correctAnswerIndex}
        />
      )}
      {learningContent && (
        <ContentCard
          content={learningContent}
          onProceed={handleProceedFromContent}
        />
      )}


      {isAnswered && explanation && !learningContent && (
        <div className={`feedback-card ${
          selectedAnswer === correctAnswerIndex ? 'feedback-success' : 'feedback-error'
        }`}>
          <div className="feedback-content">
            <div className={`feedback-icon ${
              selectedAnswer === correctAnswerIndex ? 'feedback-success' : 'feedback-error'
            }`}>
              {selectedAnswer === correctAnswerIndex ? '✓' : 'i'}
            </div>
            <div style={{ flex: 1 }}>
              <p dangerouslySetInnerHTML={{ __html: explanation }}></p>
            </div>
          </div>
        </div>
      )}


      {progress && (
        <div className="progress-card">
          <div className="progress-header" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Your Progress</h3>
            <div className="progress-score">
              {runningPct}<span style={{ fontSize: '1.4rem' }}>%</span>
            </div>
          </div>

          <div className="progress-stats">
            <div className="stat-item">
              <div className="stat-value">{progress.answered} / {numQuestions}</div>
              <div className="stat-label">Questions</div>
            </div>
            <div className="stat-item">
              <div className={`stat-value`} style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '8px 12px',
                borderRadius: '20px',
                fontSize: '1rem',
                textTransform: 'capitalize'
              }}>
                {progress.level}
              </div>
              <div className="stat-label">Level</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">⏱ {formatTime(elapsed)}</div>
              <div className="stat-label">This question</div>
            </div>
          </div>

          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ width: `${(progress.answered / numQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
      )}


      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button onClick={handleEndQuiz} className="btn btn-ghost">
          End quiz &amp; show results
        </button>
      </div>
    </div>
  );
}
