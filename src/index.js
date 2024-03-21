import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// import GoogleMapApp from './GoogleMapApp';
import MapboxMapApp from './MapboxMapApp';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MapboxMapApp />
  </React.StrictMode>
);

reportWebVitals();
