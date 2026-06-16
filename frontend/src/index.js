import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Apply the saved theme before first paint to avoid a flash.
document.documentElement.dataset.theme = localStorage.getItem('theme') || 'light';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



