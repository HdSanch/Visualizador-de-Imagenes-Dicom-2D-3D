import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';

class DicomService {
    async loadDicomFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const arrayBuffer = event.target.result;
                try {
                    const dicomData = dicomParser.parseDicom(new Uint8Array(arrayBuffer));
                    const blob = new Blob([arrayBuffer]);
                    const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
                    
                    resolve({
                        imageId,
                        metadata: this.extractMetadata(dicomData)
                    });
                } catch (error) {
                    reject(new Error('Error al parsear el archivo DICOM: ' + error.message));
                }
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    extractMetadata(dicomData) {
        try {
            return {
                patientName: this.getTag(dicomData, 'x00100010'),
                patientId: this.getTag(dicomData, 'x00100020'),
                studyDate: this.getTag(dicomData, 'x00080020'),
                modality: this.getTag(dicomData, 'x00080060'),
                studyDescription: this.getTag(dicomData, 'x00081030'),
                seriesDescription: this.getTag(dicomData, 'x0008103E'),
                windowCenter: this.getTag(dicomData, 'x00281050'),
                windowWidth: this.getTag(dicomData, 'x00281051'),
                rows: this.getTag(dicomData, 'x00280010'),
                columns: this.getTag(dicomData, 'x00280011'),
            };
        } catch (error) {
            console.error('Error al extraer metadatos:', error);
            return {};
        }
    }

    getTag(dicomData, tag) {
        try {
            const element = dicomData.elements[tag];
            if (!element) return null;
            return dicomParser.explicitElementToString(dicomData, element);
        } catch {
            return null;
        }
    }

    setWindowLevel(element, windowWidth, windowCenter) {
        const viewport = cornerstone.getViewport(element);
        viewport.voi.windowWidth = parseInt(windowWidth);
        viewport.voi.windowCenter = parseInt(windowCenter);
        cornerstone.setViewport(element, viewport);
    }

    resetView(element) {
        cornerstone.reset(element);
    }
}

export default new DicomService();