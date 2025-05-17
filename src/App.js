
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
    setUploadUrl('');
    setError('');
    setUploadProgress(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const uploadFile = async () => {
    if (!file) return setError('Please drop or select a file first.');

    const data = new FormData();
    data.append('file', file);

    try {
      const res = await axios.post('https://filesharing-backend-khaki.vercel.app/upload', data, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });
      setUploadUrl(res.data.path);
    } catch (err) {
      console.error(err);
      setError('Upload failed. Try again.');
    }
  };

  return (
    <div className="container">
      <h1>🔐 File Sharing App</h1>

      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here...</p>
        ) : (
          <p>Drag and drop a file here, or click to select</p>
        )}
      </div>

      {file && <p className="filename">📁 {file.name}</p>}

      <button onClick={uploadFile}>Upload</button>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
            {uploadProgress}%
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {uploadUrl && (
        <div className="link-box">
          <p>✅ File uploaded!</p>
          <a href={uploadUrl} target="_blank" rel="noreferrer">{uploadUrl}</a>
        </div>
      )}
    </div>
  );
}


export default App;
