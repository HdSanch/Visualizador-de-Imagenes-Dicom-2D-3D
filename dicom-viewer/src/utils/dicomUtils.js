import dicomParser from 'dicom-parser';

export const loadDicomPixelData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const byteArray = new Uint8Array(arrayBuffer);
        const dataSet = dicomParser.parseDicom(byteArray);
        
        const pixelDataElement = dataSet.elements.x7fe00010;
        if (!pixelDataElement) {
          throw new Error('No se encontraron datos de píxeles en el archivo DICOM');
        }

        // Obtener los bits almacenados y el tipo de píxel
        const bitsAllocated = dataSet.uint16('x00280100') || 16;
        const pixelRepresentation = dataSet.uint16('x00280103') || 0;
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
        
        resolve(pixelData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo DICOM'));
    reader.readAsArrayBuffer(file);
  });
};

export const getDicomMetadata = (dataSet) => {
  return {
    rows: dataSet.uint16('x00280010'),
    columns: dataSet.uint16('x00280011'),
    sliceThickness: parseFloat(dataSet.string('x00180050') || '1'),
    pixelSpacing: dataSet.string('x00280030')?.split('\\').map(Number) || [1, 1],
    windowCenter: parseFloat(dataSet.string('x00281050') || '127'),
    windowWidth: parseFloat(dataSet.string('x00281051') || '255'),
    rescaleIntercept: parseFloat(dataSet.string('x00281052') || '0'),
    rescaleSlope: parseFloat(dataSet.string('x00281053') || '1'),
  };
};