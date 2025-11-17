import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // This imports your Skill Mapper UI

// This tells React to render the App component into the HTML element with id="root"
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);