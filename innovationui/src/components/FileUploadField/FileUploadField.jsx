import React, { useRef, useState } from 'react';
import './FileUploadField.css';

const MAX_FILES = 5;
const MAX_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['.pdf', '.jpg', '.jpeg', '.png', '.mp4', '.mov'];

function isAllowedFile(file) {
  const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
  return ACCEPTED_TYPES.includes(ext) || file.type.startsWith('image/') || file.type.startsWith('video/') || file.type === 'application/pdf';
}

function formatFileSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function FileUploadField({
  field,
  existingFiles = [],
  selectedFiles = [],
  onFilesChange,
  onRemoveNew,
  disabled = false,
  error,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState('');

  const totalCount = existingFiles.length + selectedFiles.length;
  const remaining = MAX_FILES - totalCount;
  const isFull = remaining <= 0;

  const validateAndAdd = (incoming) => {
    setLocalError('');
    const fileList = Array.from(incoming);

    if (fileList.length === 0) return;

    if (totalCount + fileList.length > MAX_FILES) {
      setLocalError(`You can attach up to ${MAX_FILES} files total (${existingFiles.length} already uploaded).`);
      return;
    }

    const invalidType = fileList.find((file) => !isAllowedFile(file));
    if (invalidType) {
      setLocalError('Only PDF, photo, or video files are allowed.');
      return;
    }

    const oversized = fileList.find((file) => file.size > MAX_SIZE);
    if (oversized) {
      setLocalError('Each file must be less than 8MB.');
      return;
    }

    onFilesChange(field.name, [...selectedFiles, ...fileList]);
  };

  const handleInputChange = (e) => {
    validateAndAdd(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isFull) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isFull) return;
    validateAndAdd(e.dataTransfer.files);
  };

  const displayError = error || localError;

  return (
    <div className="form-group file-upload-group">
      <label>{field.label} {field.required && <span className="required">*</span>}</label>

      <div
        className={`file-dropzone ${isDragging ? 'dragging' : ''} ${isFull ? 'full' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isFull && inputRef.current?.click()}
        role="button"
        tabIndex={disabled || isFull ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isFull) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          name={field.name}
          multiple
          accept=".pdf,image/*,video/*"
          onChange={handleInputChange}
          disabled={disabled || isFull}
          className="file-input-hidden"
        />

        <div className="file-dropzone-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="file-dropzone-title">
          {isFull ? 'Maximum files reached' : 'Drag & drop files here'}
        </p>
        {!isFull && (
          <p className="file-dropzone-subtitle">
            or <span className="file-browse-link">browse files</span>
          </p>
        )}
        <p className="file-dropzone-hint">
          Up to {MAX_FILES} files at a time · PDF, photo, or video · 8MB each
        </p>
        <p className="file-dropzone-count">{totalCount} of {MAX_FILES} files attached</p>
      </div>

      {(existingFiles.length > 0 || selectedFiles.length > 0) && (
        <ul className="file-list">
          {existingFiles.map((file) => (
            <li key={`existing-${file.id || file.Id}-${file.fileName || file.FileName}`} className="file-list-item existing">
              <div className="file-list-info">
                <span className="file-name">{file.fileName || file.FileName}</span>
                <span className="file-meta">{formatFileSize(file.fileSize || file.FileSize)} · Uploaded</span>
              </div>
            </li>
          ))}
          {selectedFiles.map((file, idx) => (
            <li key={`new-${file.name}-${idx}`} className="file-list-item new">
              <div className="file-list-info">
                <span className="file-name">{file.name}</span>
                <span className="file-meta">{formatFileSize(file.size)} · Ready to upload</span>
              </div>
              {!disabled && (
                <button
                  type="button"
                  className="file-remove-btn"
                  onClick={() => onRemoveNew(field.name, idx)}
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {displayError && <span className="error">{displayError}</span>}
    </div>
  );
}
