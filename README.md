# 🧠 AI Micro-Learning Engine

A personalized, adaptive micro-learning engine designed to improve learning outcomes and reduce fatigue, built with React, FastAPI, and Google's Gemini API. This project fulfills the prompt of creating an intelligent system that infers a learner's competence from their interactions and adapts the learning path accordingly.

## Core Features

-   **Adaptive Learning Path**: The engine adjusts question difficulty and introduces learning content based on user performance.
-   **AI-Generated Content**: Questions and learning materials are generated on-the-fly by an LLM (via Gemini), tailored to the user's chosen topic.
-   **Competency Tracking**: The system tracks performance against specific skills within a topic to provide measurable learning outcomes.
-   **Micro-Learning Format**: Learning is delivered in short, focused sessions of 5 questions to maintain engagement and prevent fatigue.

## Tech Stack

-   **Frontend**: React.js
-   **Backend**: Python with FastAPI
-   **AI Integration**: Gemini
-   **API Communication**: Axios

## Setup and Running the Project

### Prerequisites

-   Node.js and npm
-   Python 3.8+ and pip
-   A Google API Key with the Gemini API enabled.

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
4.  Create a `.env` file in the `backend` directory and add your Google API key:
    ```
    GOOGLE_API_KEY="YOUR_API_KEY"
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
-   `POST /register`: Creates a new user.
-   `POST /login`: Logs in a user.
-   `GET /history/{user_id}`: Retrieves the quiz history for a user.