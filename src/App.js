
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './App.css';
import { uploadFile } from './service/api.js';

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file icon based on file type
const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();

  const fileIcons = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📑',
    pptx: '📑',
    txt: '📃',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    mp3: '🎵',
    mp4: '🎬',
    zip: '🗜️',
    rar: '🗜️',
  };

  return fileIcons[extension] || '📁';
};

function App() {
  const [file, setFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState("");
  const [isLimitEnabled, setIsLimitEnabled] = useState(false);
  const [fileId, setFileId] = useState(null);
  const [fileStatus, setFileStatus] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadUrl('');
      setError('');
      setUploadProgress(0);
      setFileStatus(null);
      setFileId(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 100 * 1024 * 1024, // 100MB max size
    onDropRejected: () => {
      setError('File is too large. Maximum size is 100MB.');
    }
  });

  const handleUpload = async () => {
    if (!file) return setError('Please drop or select a file first.');
    
    if (isLimitEnabled && (maxDownloads === "" || parseInt(maxDownloads) < 1)) {
      return setError('Please set a valid download limit (minimum 1)');
    }

    setIsUploading(true);
    setError('');

    const data = new FormData();
    data.append('file', file);
    
    if (isLimitEnabled) {
      data.append('maxDownloads', maxDownloads);
    }

    try {
      const result = await uploadFile(data);
      if (result) {
        setUploadUrl(result.path);
        // Extract file ID from the URL
        const urlParts = result.path.split('/');
        const id = urlParts[urlParts.length - 1];
        setFileId(id);
        setUploadProgress(100);
      } else {
        setError('Upload failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uploadUrl)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        setError('Failed to copy link. Please try again.');
      });
  };

  // Reset copy success message after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Handle max downloads input change
  const handleMaxDownloadsChange = (e) => {
    const value = e.target.value;
    // Only allow positive integers
    if (value === '' || /^[1-9][0-9]*$/.test(value)) {
      setMaxDownloads(value);
    }
  };

  // Toggle download limit
  const toggleLimitEnabled = () => {
    setIsLimitEnabled(!isLimitEnabled);
    if (!isLimitEnabled && maxDownloads === "") {
      setMaxDownloads("1"); // Default to 1 if no value is set
    }
  };

  // Add a function to check file status
  const checkFileStatus = async () => {
    if (!fileId) return;
    
    try {
      const response = await axios.get(`https://filesharing-backend-t3ym.onrender.com/file/${fileId}/status`);
      setFileStatus(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to check file status');
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <div className="app-logo">
            <span>🔐</span> SecureShare
          </div>
        </div>
      </header>

      <div className="container">
        <h1>Secure File Sharing</h1>
        <p className="app-description">
          Upload and share files securely with anyone. Files are encrypted and links expire after download.
        </p>

        <div
          {...getRootProps({
            className: `dropzone ${isDragActive ? 'active' : ''}`
          })}
        >
          <input {...getInputProps()} />
          <div className="dropzone-icon">
            {isDragActive ? '📥' : '📤'}
          </div>
          {isDragActive ? (
            <p>Drop the file here...</p>
          ) : (
            <>
              <p>Drag and drop a file here</p>
              <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>or click to select</p>
            </>
          )}
        </div>

        {file && (
          <div className="file-info">
            <span>{getFileIcon(file.name)}</span>
            <span className="filename">{file.name}</span>
            <span className="file-size">({formatFileSize(file.size)})</span>
          </div>
        )}

        {file && (
          <div className="upload-options">
            <label className="limit-option">
              <input
                type="checkbox"
                checked={isLimitEnabled}
                onChange={toggleLimitEnabled}
              />
              <span>Set download limit</span>
            </label>
            
            {isLimitEnabled && (
              <div className="download-limit-input">
                <input
                  type="text"
                  value={maxDownloads}
                  onChange={handleMaxDownloadsChange}
                  placeholder="Number of downloads"
                />
                <span className="input-label">downloads</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={isUploading ? 'pulse' : ''}
        >
          {isUploading ? '⏳ Uploading...' : '📤 Upload File'}
        </button>

        {uploadProgress > 0 && (
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${uploadProgress}%` }}
            >
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          </div>
        )}

        {error && (
          <p className="error">
            <span>⚠️</span> {error}
          </p>
        )}

        {uploadUrl && (
          <div className="link-box">
            <p className="success-message">
              <span>✅</span> File uploaded successfully!
            </p>
            
            {fileStatus && fileStatus.expired ? (
              <p className="expired-link">
                <span>⚠️</span> This link has expired after reaching the download limit
              </p>
            ) : (
              <>
                <a href={uploadUrl} target="_blank" rel="noreferrer">{uploadUrl}</a>
                
                {fileStatus && fileStatus.maxDownloads && (
                  <div className="download-status">
                    <p>Downloads: {fileStatus.downloadCount} / {fileStatus.maxDownloads}</p>
                    <div className="download-progress">
                      <div 
                        className="download-progress-bar" 
                        style={{ width: `${(fileStatus.downloadCount / fileStatus.maxDownloads) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {isLimitEnabled && !fileStatus && (
                  <p className="limit-note">
                    <span>ℹ️</span> This link will expire after {maxDownloads} download{maxDownloads !== "1" ? "s" : ""}
                  </p>
                )}
                
                <button onClick={copyToClipboard} className="copy-btn">
                  {copySuccess ? '✅ Copied!' : '📋 Copy Link'}
                </button>
                
                <button onClick={checkFileStatus} className="status-btn">
                  Check Link Status
                </button>
              </>
            )}
          </div>
        )}
      </div>

   
    </>
  );
}


export default App;
