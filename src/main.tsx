import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LoginGate } from './components/LoginGate';
import 'highlight.js/styles/github-dark.min.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoginGate>
      <App />
    </LoginGate>
  </StrictMode>
);
