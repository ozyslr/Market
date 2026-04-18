import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { useUIStore } from './store/uiStore';

// Apply saved dark mode preference on initial load
const { darkMode } = useUIStore.getState()
if (darkMode) document.documentElement.classList.add('dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
