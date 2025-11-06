import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiFile } from 'react-icons/fi';

const FileUploader = ({ label, onFileSelect, selectedFile, multiple = false, accept }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (multiple) {
      onFileSelect(acceptedFiles);
    } else {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect, multiple]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    }
  });

  const removeFile = (e, index = null) => {
    e.stopPropagation();
    if (multiple && index !== null) {
      const newFiles = [...selectedFile];
      newFiles.splice(index, 1);
      onFileSelect(newFiles);
    } else {
      onFileSelect(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="file-uploader">
      <label className="upload-label">{label}</label>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
      >
        <input {...getInputProps()} />

        {!selectedFile || (multiple && selectedFile.length === 0) ? (
          <div className="upload-prompt">
            <FiUpload size={48} />
            <p className="upload-text">
              {isDragActive ? '파일을 여기에 놓으세요' : '파일을 드래그하거나 클릭하여 업로드'}
            </p>
            <p className="upload-hint">
              지원 형식: PDF, Word, TXT, Excel, CSV
            </p>
          </div>
        ) : (
          <div className="uploaded-files">
            {multiple ? (
              selectedFile.map((file, index) => (
                <div key={index} className="file-item">
                  <FiFile className="file-icon" />
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={(e) => removeFile(e, index)}
                    type="button"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              ))
            ) : (
              <div className="file-item">
                <FiFile className="file-icon" />
                <div className="file-info">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                </div>
                <button
                  className="remove-btn"
                  onClick={removeFile}
                  type="button"
                >
                  <FiX size={20} />
                </button>
              </div>
            )}
            <p className="change-file-hint">클릭하여 파일 변경</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
