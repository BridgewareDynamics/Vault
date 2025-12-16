import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { logger } from './utils/logger';

// Handle uncaught errors in renderer process
window.addEventListener('error', (event) => {
  logger.error('Uncaught error in renderer:', event.error);
});

// Handle unhandled promise rejections in renderer process
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection in renderer:', event.reason);
  // Prevent default browser behavior
  event.preventDefault();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);



