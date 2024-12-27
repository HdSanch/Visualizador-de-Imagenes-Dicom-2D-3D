import React from 'react';

const MetadataPanel = ({ metadata }) => {
  if (!metadata) return null;

  return (
    <div className="metadata-panel">
      <h3>Información DICOM</h3>
      <table>
        <tbody>
          {Object.entries(metadata).map(([key, value]) => (
            value && (
              <tr key={key}>
                <td className="metadata-label">{key}:</td>
                <td className="metadata-value">{value}</td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MetadataPanel;