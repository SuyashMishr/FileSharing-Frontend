import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './App.css';

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
  const [maxDownloads, setMaxDownloads] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadUrl('');
      setError('');
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 100 * 1024 * 1024, // 100MB max size
    onDropRejected: () => {
      setError('File is too large. Maximum size is 100MB.');
    }
  });

  const uploadFile = async () => {
    if (!file) return setError('Please drop or select a file first.');

    setIsUploading(true);
    setError('');

    const data = new FormData();
    data.append('file', file);
    if (maxDownloads) {
      data.append('maxDownloads', maxDownloads);
    }

    try {
      const res = await axios.post('https://filesharing-backend-t3ym.onrender.com/upload', data, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });
      setUploadUrl(res.data.path);
      setUploadProgress(100);
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
          <div className="download-limit">
            <label htmlFor="maxDownloads">🔢 Max Downloads (optional):</label>
            <input
              type="number"
              id="maxDownloads"
              placeholder="e.g. 3"
              value={maxDownloads}
              onChange={(e) => setMaxDownloads(e.target.value)}
              min="1"
              className="download-input"
            />
          </div>
        )}

        <button
          onClick={uploadFile}
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
            <a href={uploadUrl} target="_blank" rel="noreferrer">{uploadUrl}</a>
            <button onClick={copyToClipboard} className="copy-btn">
              {copySuccess ? '✅ Copied!' : '📋 Copy Link'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
