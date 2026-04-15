import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// StrictMode omitted intentionally — it double-invokes effects in dev,
// which would run two tick intervals and distort all resource rates.
createRoot(document.getElementById('root')).render(<App />);

