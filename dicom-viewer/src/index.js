import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Importaciones necesarias para Cornerstone
import Hammer from 'hammerjs';  // Agregada importación explícita de Hammer
import dicomParser from 'dicom-parser';
import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import cornerstoneTools from 'cornerstone-tools';

// Estilos necesarios
import './index.css';

// Configuración inicial de Cornerstone
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneTools.external.Hammer = Hammer;  // Ahora Hammer está definido

// Inicializar el gestor de web workers para la carga de imágenes
cornerstoneWADOImageLoader.webWorkerManager.initialize({
  maxWebWorkers: navigator.hardwareConcurrency || 1,
  startWebWorkersOnDemand: true,
  taskConfiguration: {
    decodeTask: {
      loadCodecsOnStartup: true,
      initializeCodecsOnStartup: false,
    },
  },
});

// Crear el contenedor raíz y renderizar la aplicación
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);