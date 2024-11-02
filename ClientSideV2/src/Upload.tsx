import React, { useState } from 'react';
import './Upload.css';

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({ name: '', year: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [yearError, setYearError] = useState('');

  const validateYear = (year: string) => {
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year, 10);
    return !isNaN(yearNum) && yearNum > 0 && yearNum <= currentYear;
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = e.target.value;
    setMetadata({
      ...metadata,
      year: newYear,
    });
    if (newYear && !validateYear(newYear)) {
      setYearError('Please enter a valid year');
    } else {
      setYearError('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetadata({
      ...metadata,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setUploadProgress(0);
    setProcessingProgress(0);

    if (!file) {
      setError('No file selected');
      setIsLoading(false);
      return;
    }

    if (!metadata.name || !metadata.year) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (!validateYear(metadata.year)) {
      setYearError('Please enter a valid year');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', metadata.name);
    formData.append('year', metadata.year);

    try {
      const token = localStorage.getItem('token');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:5000/api/upload', true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          console.log('Article uploaded successfully');
          simulateProcessing();
        } else {
          console.error('Error uploading article:', xhr.statusText);
          setError('Failed to upload article. Please try again.');
          setIsLoading(false);
        }
      };

      xhr.onerror = () => {
        console.error('Error uploading article');
        setError('An error occurred while uploading. Please try again.');
        setIsLoading(false);
      };

      xhr.send(formData);
    } catch (error) {
      console.error('Error uploading article:', error);
      setError('An error occurred while uploading. Please try again.');
      setIsLoading(false);
    }
  };

  const simulateProcessing = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsLoading(false);
      }
      setProcessingProgress(Math.round(progress));
    }, 500);
  };

  const totalProgress = Math.round((uploadProgress + processingProgress) / 2);

  return (
    <div className="upload-container">
      <h1>Upload</h1>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="file">File:</label>
          <input type="file" onChange={handleFileChange} className="form-input" disabled={isLoading} />
        </div>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            name="name"
            value={metadata.name}
            onChange={handleMetadataChange}
            className="form-input"
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="year">Year:</label>
          <input
            type="text"
            name="year"
            value={metadata.year}
            onChange={handleYearChange}
            className={`form-input ${yearError ? 'input-error' : ''}`}
            disabled={isLoading}
          />
          {yearError && <span className="error-message">{yearError}</span>}
        </div>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Uploading...' : 'Upload'}
        </button>
        {isLoading && (
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${totalProgress}%` }}>
              <span className="progress-text">{totalProgress}%</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default Upload;