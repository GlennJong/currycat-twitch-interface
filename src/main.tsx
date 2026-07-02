import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import DockApp from './DockApp';
import './global.css';
import './components/UI/style.css';

const params = new URLSearchParams(window.location.search);
const mode = params.get('mode');

const RootComponent = mode === 'dock' ? DockApp : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
)
