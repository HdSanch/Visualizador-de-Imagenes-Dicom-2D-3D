// src/components/dicomViewer/Dicom3DViewer.jsx
import React, { useEffect, useRef, useState } from 'react';
import '@kitware/vtk.js/Rendering/Profiles/All';
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import dicomParser from 'dicom-parser';

const Dicom3DViewer = () => {
  const vtkContainerRef = useRef(null);
  const renderWindowRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const container = vtkContainerRef.current;
    if (!container) return;

    // Inicializar VTK
    const genericRenderWindow = vtkGenericRenderWindow.newInstance();
    genericRenderWindow.setContainer(container);
    genericRenderWindow.setBackground(0, 0, 0);

    const renderWindow = genericRenderWindow.getRenderWindow();
    const renderer = genericRenderWindow.getRenderer();

    const volumeMapper = vtkVolumeMapper.newInstance();
    const volume = vtkVolume.newInstance();
    volume.setMapper(volumeMapper);

    renderer.addVolume(volume);

    // Guardar referencias
    renderWindowRef.current = {
      genericRenderWindow,
      renderWindow,
      renderer,
      volumeMapper,
      volume,
    };

    // Configurar interacción
    const interactor = renderWindow.getInteractor();
    interactor.setDesiredUpdateRate(15);
    interactor.initialize();
    interactor.bindEvents(container);

    return () => {
      if (renderWindowRef.current) {
        renderWindowRef.current.genericRenderWindow.delete();
        renderWindowRef.current = null;
      }
    };
  }, []);

  const handleFileSelect = async (event) => {
    if (!renderWindowRef.current) return;
    
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsLoading(true);

    try {
      // Cargar archivos DICOM
      const loadedFiles = await Promise.all(files.map(async file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const arrayBuffer = e.target.result;
              const byteArray = new Uint8Array(arrayBuffer);
              const dataSet = dicomParser.parseDicom(byteArray);
              
              // Obtener los datos de píxeles
              const pixelDataElement = dataSet.elements.x7fe00010;
              const bitsAllocated = dataSet.uint16('x00280100');
              const pixelRepresentation = dataSet.uint16('x00280103');
              const pixelData = new Float32Array(pixelDataElement.length / (bitsAllocated / 8));

              // Convertir los datos según el formato
              const pixelDataView = new DataView(dataSet.byteArray.buffer, pixelDataElement.dataOffset);
              for (let i = 0; i < pixelData.length; i++) {
                if (bitsAllocated === 16) {
                  pixelData[i] = pixelRepresentation === 0
                    ? pixelDataView.getUint16(i * 2, true)
                    : pixelDataView.getInt16(i * 2, true);
                } else {
                  pixelData[i] = pixelDataView.getUint8(i);
                }
              }

              resolve({
                pixelData,
                metadata: {
                  sliceLocation: parseFloat(dataSet.string('x00201041') || '0'),
                  rows: dataSet.uint16('x00280010'),
                  columns: dataSet.uint16('x00280011'),
                  pixelSpacing: dataSet.string('x00280030')?.split('\\').map(Number) || [1, 1],
                  sliceThickness: parseFloat(dataSet.string('x00180050') || '1'),
                },
              });
            } catch (error) {
              reject(error);
            }
          };
          reader.readAsArrayBuffer(file);
        });
      }));

      // Ordenar por posición
      loadedFiles.sort((a, b) => a.metadata.sliceLocation - b.metadata.sliceLocation);

      // Crear el volumen
      const firstSlice = loadedFiles[0];
      const dimensions = [
        firstSlice.metadata.columns,
        firstSlice.metadata.rows,
        loadedFiles.length,
      ];

      const imageData = vtkImageData.newInstance();
      imageData.setDimensions(dimensions);
      imageData.setSpacing(
        firstSlice.metadata.pixelSpacing[0],
        firstSlice.metadata.pixelSpacing[1],
        firstSlice.metadata.sliceThickness
      );

      // Combinar datos
      const scalars = new Float32Array(dimensions[0] * dimensions[1] * dimensions[2]);
      loadedFiles.forEach((file, i) => {
        const offset = i * dimensions[0] * dimensions[1];
        scalars.set(file.pixelData, offset);
      });

      const dataArray = vtkDataArray.newInstance({
        name: 'scalars',
        values: scalars,
        numberOfComponents: 1,
      });

      imageData.getPointData().setScalars(dataArray);

      // Configurar funciones de transferencia
      const dataRange = dataArray.getRange();
      const cfun = vtkColorTransferFunction.newInstance();
      const ofun = vtkPiecewiseFunction.newInstance();

      // Ajustar valores según el rango de los datos
      cfun.addRGBPoint(dataRange[0], 0.0, 0.0, 0.0);
      cfun.addRGBPoint((dataRange[0] + dataRange[1]) / 4, 0.5, 0.0, 0.0);
      cfun.addRGBPoint((dataRange[0] + dataRange[1]) / 2, 0.9, 0.2, 0.2);
      cfun.addRGBPoint(dataRange[1], 1.0, 1.0, 1.0);

      ofun.addPoint(dataRange[0], 0.0);
      ofun.addPoint((dataRange[0] + dataRange[1]) / 4, 0.1);
      ofun.addPoint((dataRange[0] + dataRange[1]) / 2, 0.5);
      ofun.addPoint(dataRange[1], 0.9);

      // Actualizar el volumen
      renderWindowRef.current.volumeMapper.setInputData(imageData);
      renderWindowRef.current.volume.getProperty().setRGBTransferFunction(0, cfun);
      renderWindowRef.current.volume.getProperty().setScalarOpacity(0, ofun);
      renderWindowRef.current.volume.getProperty().setInterpolationTypeToLinear();
      renderWindowRef.current.volume.getProperty().setShade(true);
      renderWindowRef.current.volume.getProperty().setAmbient(0.2);
      renderWindowRef.current.volume.getProperty().setDiffuse(0.7);
      renderWindowRef.current.volume.getProperty().setSpecular(0.3);
      renderWindowRef.current.volume.getProperty().setSpecularPower(8.0);

      // Actualizar la vista
      renderWindowRef.current.renderer.resetCamera();
      renderWindowRef.current.renderWindow.render();

    } catch (error) {
      console.error('Error al cargar archivos DICOM:', error);
      alert('Error al cargar los archivos DICOM');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dicom-3d-viewer-container">
      <div className="toolbar-3d">
        <input
          type="file"
          multiple
          accept=".dcm"
          onChange={handleFileSelect}
          className="file-input-3d"
        />
      </div>
      <div 
        ref={vtkContainerRef} 
        className="vtk-container" 
        style={{ width: '100%', height: '500px', background: '#000' }}
      />
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Procesando imágenes DICOM...</div>
        </div>
      )}
    </div>
  );
};

export default Dicom3DViewer;