import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// import GoogleMap from './GoogleMap';
import MapboxMap from './MapboxMap';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MapboxMap />
  </React.StrictMode>
);
