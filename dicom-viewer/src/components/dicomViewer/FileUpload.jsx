import React from 'react';

const FileUpload = ({ onFileSelect }) => {
  return (
    <div className="file-upload">
      <input
        type="file"
        accept=".dcm"
        onChange={onFileSelect}
        style={{ display: 'none' }}
        id="dicom-upload"
      />
      <label htmlFor="dicom-upload" className="upload-button">
        Cargar imagen DICOM
      </label>
    </div>
  );
};

export default FileUpload;
