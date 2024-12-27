import React, { useState } from 'react';
import Dicom2DViewer from './Dicom2DViewer';
import Dicom3DViewer from './Dicom3DViewer';
import './styles.css';

const DicomViewer = () => {
  const [activeViewer, setActiveViewer] = useState('2D');

  return (
    <div className="dicom-main-container">
      <div className="viewer-selector">
        <button 
          className={`selector-button ${activeViewer === '2D' ? 'active' : ''}`}
          onClick={() => setActiveViewer('2D')}
        >
          Visor 2D
        </button>
        <button 
          className={`selector-button ${activeViewer === '3D' ? 'active' : ''}`}
          onClick={() => setActiveViewer('3D')}
        >
          Visor 3D
        </button>
      </div>

      {activeViewer === '2D' ? (
        <div className="viewer-section">
          <div className="viewer-header">
            <h3 className="viewer-title">Visor 2D</h3>
            <span className="viewer-description">Visualización de cortes individuales DICOM</span>
          </div>
          <div className="viewer-content">
            <Dicom2DViewer />
          </div>
        </div>
      ) : (
        <div className="viewer-section">
          <div className="viewer-header">
            <h3 className="viewer-title">Visor 3D</h3>
            <span className="viewer-description">Visualización volumétrica de series DICOM</span>
          </div>
          <div className="viewer-content">
            <Dicom3DViewer />
          </div>
        </div>
      )}
    </div>
  );
};

export default DicomViewer;