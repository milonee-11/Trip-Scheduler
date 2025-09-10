import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // ✅ Correct for default export
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Required for collapse
import 'leaflet/dist/leaflet.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
