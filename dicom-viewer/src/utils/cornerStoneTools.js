import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import Hammer from 'hammerjs';

export function initCornerstone() {
  // Inicializar cornerstone-tools
  cornerstoneTools.external.cornerstone = cornerstone;
  cornerstoneTools.external.Hammer = Hammer;
  
  // Inicializar WADO Image loader
  cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
  cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

  // Inicializar cornerstoneTools
  cornerstoneTools.init({
    mouseEnabled: true,
    touchEnabled: true,
    globalToolSyncEnabled: false,
    showSVGCursors: true
  });

  // Inicializar el gestor de web workers
  cornerstoneWADOImageLoader.webWorkerManager.initialize({
    maxWebWorkers: navigator.hardwareConcurrency || 1,
    startWebWorkersOnDemand: true,
  });

  // Registrar todas las herramientas necesarias
  cornerstoneTools.addTool(cornerstoneTools.PanTool);
  cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
  cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
  cornerstoneTools.addTool(cornerstoneTools.LengthTool);
  cornerstoneTools.addTool(cornerstoneTools.MagnifyTool);
  cornerstoneTools.addTool(cornerstoneTools.RotateTool);
  cornerstoneTools.addTool(cornerstoneTools.ProbeTool);
}