import React from 'react';
import './styles.css';

const LoadingSpinner = () => (
  <div className="loading-overlay">
    <div className="loading-spinner"></div>
    <div className="loading-text">Cargando...</div>
  </div>
);

export default LoadingSpinner;