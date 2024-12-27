import React, { useEffect, useRef, useState } from 'react';
import cornerstone from 'cornerstone-core';
import FileUpload from './FileUpload';
import ToolBar from './toolBar';
import MetadataPanel from './MetadataPanel';
import LoadingSpinner from './LoadingSpinner';
import dicomService from '../../services/dicomService';
import './styles.css';

const Dicom2DViewer = () => {
  const elementRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [windowWidth, setWindowWidth] = useState(255);
  const [windowCenter, setWindowCenter] = useState(127);

  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      // Habilitar el elemento para cornerstone
      cornerstone.enable(element);

      // Limpiar al desmontar
      return () => {
        cornerstone.disable(element);
      };
    }
  }, []);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const { imageId, metadata: dicomMetadata } = await dicomService.loadDicomFile(file);
      const element = elementRef.current;
      
      if (element) {
        const image = await cornerstone.loadImage(imageId);
        await cornerstone.displayImage(element, image);
        setMetadata(dicomMetadata);
        setIsLoaded(true);

        // Establecer valores iniciales de ventana/nivel desde los metadatos
        if (dicomMetadata.windowWidth && dicomMetadata.windowCenter) {
          setWindowWidth(dicomMetadata.windowWidth);
          setWindowCenter(dicomMetadata.windowCenter);
          updateWindowLevel(dicomMetadata.windowWidth, dicomMetadata.windowCenter);
        }
      }
    } catch (error) {
      console.error('Error al cargar la imagen:', error);
      alert('Error al cargar la imagen DICOM');
    } finally {
      setIsLoading(false);
    }
  };

  const updateWindowLevel = (width, center) => {
    const element = elementRef.current;
    if (!element || !isLoaded) return;

    const viewport = cornerstone.getViewport(element);
    viewport.voi.windowWidth = width;
    viewport.voi.windowCenter = center;
    cornerstone.setViewport(element, viewport);
  };

  const adjustZoom = (factor) => {
    const element = elementRef.current;
    if (!element || !isLoaded) return;

    const viewport = cornerstone.getViewport(element);
    const newZoom = zoom * factor;
    viewport.scale = newZoom;
    cornerstone.setViewport(element, viewport);
    setZoom(newZoom);
  };

  const rotateImage = (angle) => {
    const element = elementRef.current;
    if (!element || !isLoaded) return;

    const viewport = cornerstone.getViewport(element);
    viewport.rotation += angle;
    cornerstone.setViewport(element, viewport);
  };

  const flipImage = (horizontal = true) => {
    const element = elementRef.current;
    if (!element || !isLoaded) return;

    const viewport = cornerstone.getViewport(element);
    if (horizontal) {
      viewport.hflip = !viewport.hflip;
    } else {
      viewport.vflip = !viewport.vflip;
    }
    cornerstone.setViewport(element, viewport);
  };

  const resetView = () => {
    const element = elementRef.current;
    if (!element || !isLoaded) return;

    cornerstone.reset(element);
    setZoom(1);
    const viewport = cornerstone.getViewport(element);
    setWindowWidth(viewport.voi.windowWidth);
    setWindowCenter(viewport.voi.windowCenter);
  };

  const adjustWindowLevel = (widthDelta, centerDelta) => {
    const newWidth = windowWidth + widthDelta;
    const newCenter = windowCenter + centerDelta;
    setWindowWidth(newWidth);
    setWindowCenter(newCenter);
    updateWindowLevel(newWidth, newCenter);
  };

  return (
    <div className="dicom-2d-viewer-container">
      <div className="toolbar">
        <div className="tool-group">
          <button 
            onClick={() => adjustZoom(1.1)} 
            disabled={!isLoaded}
            title="Acercar"
          >
            Zoom +
          </button>
          <button 
            onClick={() => adjustZoom(0.9)} 
            disabled={!isLoaded}
            title="Alejar"
          >
            Zoom -
          </button>
        </div>
        
        <div className="tool-group">
          <button 
            onClick={() => adjustWindowLevel(10, 0)} 
            disabled={!isLoaded}
            title="Aumentar contraste"
          >
            Contraste +
          </button>
          <button 
            onClick={() => adjustWindowLevel(-10, 0)} 
            disabled={!isLoaded}
            title="Disminuir contraste"
          >
            Contraste -
          </button>
          <button 
            onClick={() => adjustWindowLevel(0, 10)} 
            disabled={!isLoaded}
            title="Aumentar brillo"
          >
            Brillo +
          </button>
          <button 
            onClick={() => adjustWindowLevel(0, -10)} 
            disabled={!isLoaded}
            title="Disminuir brillo"
          >
            Brillo -
          </button>
        </div>

        <div className="tool-group">
          <button 
            onClick={() => rotateImage(90)} 
            disabled={!isLoaded}
            title="Rotar 90° en sentido horario"
          >
            Rotar
          </button>
          <button 
            onClick={() => flipImage(true)} 
            disabled={!isLoaded}
            title="Voltear horizontalmente"
          >
            Voltear H
          </button>
          <button 
            onClick={() => flipImage(false)} 
            disabled={!isLoaded}
            title="Voltear verticalmente"
          >
            Voltear V
          </button>
        </div>

        <div className="tool-group">
          <button 
            onClick={resetView} 
            disabled={!isLoaded}
            title="Restablecer vista"
          >
            Reset
          </button>
          <button 
            onClick={() => setShowMetadata(!showMetadata)} 
            disabled={!isLoaded}
            title="Mostrar/Ocultar información DICOM"
          >
            {showMetadata ? 'Ocultar Info' : 'Mostrar Info'}
          </button>
        </div>
      </div>

      <div className="viewer-content">
        <FileUpload onFileSelect={handleFileSelect} />
        <div 
          ref={elementRef}
          className="cornerstone-element"
          onContextMenu={(e) => e.preventDefault()}
        />
        {isLoading && <LoadingSpinner />}
        {showMetadata && <MetadataPanel metadata={metadata} />}
      </div>
    </div>
  );
};

export default Dicom2DViewer;