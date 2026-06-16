# 🧠 AI Micro-Learning Engine

A personalized, adaptive micro-learning engine designed to improve learning outcomes and reduce fatigue, built with React, FastAPI, and Google's Gemini API. This project fulfills the prompt of creating an intelligent system that infers a learner's competence from their interactions and adapts the learning path accordingly.

## Core Features

-   **Adaptive Learning Path**: The engine adjusts question difficulty and introduces learning content based on user performance.
-   **AI-Generated Content**: Questions and learning materials are generated on-the-fly by an LLM (via Gemini), tailored to the user's chosen topic.
-   **Competency Tracking**: The system tracks performance against specific skills within a topic to provide measurable learning outcomes.
-   **Micro-Learning Format**: Learning is delivered in short, focused sessions to maintain engagement and prevent fatigue.
-   **AI Session Coach**: A personalized end-of-session review with concrete study recommendations.
-   **Hints & Explanations**: On-demand hints (no answer spoilers) during a quiz, and "Explain" on any reviewed question.
-   **Analytics Dashboard**: Accuracy, day streaks, weakest-skill breakdown, and score-over-time, all from your history.

## Tech Stack

-   **Frontend**: React.js
-   **Backend**: Python with FastAPI
-   **Database**: Neon (serverless PostgreSQL)
-   **AI Integration**: Gemini
-   **API Communication**: Axios

> 📘 For architecture, the data model, the full API reference, and a
> step-by-step **deployment guide**, see [TECHNICAL.md](./TECHNICAL.md).

## Setup and Running the Project

### Prerequisites

-   Node.js and npm
-   Python 3.8+ and pip
-   A Google API Key with the Gemini API enabled.
-   A Neon PostgreSQL database (free tier at https://neon.tech).

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and activate it:
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
    ```
3.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
4.  Create a `.env` file in the `backend` directory (copy `.env.example`) and fill in:
    ```
    GOOGLE_API_KEY="YOUR_API_KEY"
    DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
    ALLOWED_ORIGINS="http://localhost:3000"
    ```
5.  Run the FastAPI server:
    ```bash
    uvicorn main:app --reload
    ```
    The backend will be available at `http://127.0.0.1:8000`.

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the required npm packages:
    ```bash
    npm install
    ```
3.  Run the React development server:
    ```bash
    npm start
    ```
    The frontend will open automatically at `http://localhost:3000`.

## API Endpoints

-   `POST /start`: Initializes a new quiz session.
-   `POST /answer`: Submits an answer and receives the next step (question or content).
-   `POST /finish`: Ends a session early and saves it to history.
-   `POST /register`: Creates a new user.
-   `POST /login`: Logs in a user.
-   `GET /history/{user_id}`: Retrieves the quiz history for a user.