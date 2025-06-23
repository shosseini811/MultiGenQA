import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/*
This is the entry point of our React application.
Think of it as the "main" function that starts everything.

ReactDOM.createRoot() creates a "root" where our entire app will live.
It's like creating a container that holds all our React components.
*/

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 