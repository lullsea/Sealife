import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// No <StrictMode>: in development it runs every effect twice, which would
// send every request twice and clutter the request log.
createRoot(document.getElementById('root')!).render(<App />);
