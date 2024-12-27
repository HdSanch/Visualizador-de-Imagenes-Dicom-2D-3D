import React from 'react';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import './styles.css';

const ToolBar = ({ element, isLoaded }) => {
  const activateTool = (toolName) => {
    if (!isLoaded || !element || !cornerstone.getImage(element)) {
      return;
    }
    
    cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
  };

  return (
    <div className="toolbar">
      <button 
        onClick={() => activateTool('Pan')}
        disabled={!isLoaded}
      >
        Pan
      </button>
      <button 
        onClick={() => activateTool('Zoom')}
        disabled={!isLoaded}
      >
        Zoom
      </button>
      <button 
        onClick={() => activateTool('Wwwc')}
        disabled={!isLoaded}
      >
        Window/Level
      </button>
      <button 
        onClick={() => activateTool('Length')}
        disabled={!isLoaded}
      >
        Measure
      </button>
    </div>
  );
};

export default ToolBar;