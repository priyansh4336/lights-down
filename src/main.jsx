import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AppErrorBoundary } from './components/ErrorBoundary.jsx';
import './styles/base.css';
import './styles/layout.css';
import './styles/screens.css';
import './styles/components.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
