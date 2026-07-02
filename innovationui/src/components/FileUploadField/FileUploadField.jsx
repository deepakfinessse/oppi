import React, { useRef, useState, useEffect } from 'react';
import { getFileUrl } from '../../services/api';
import './FileUploadField.css';

function isImageFile(name, mimeType, fileType) {
  const ext = (fileType || name?.split('.').pop() || '').toLowerCase().replace(/^\./, '');
  return ['jpg', 'jpeg', 'jpe', 'png'].includes(ext);
}

function isVideoFile(name, mimeType, fileType) {
  const ext = (fileType || name?.split('.').pop() || '').toLowerCase().replace(/^\./, '');
  return ['asf', 'asx', 'wmv', 'wmx', 'wm', 'avi', 'divx', 'flv', 'mov', 'qt', 'mpeg', 'mpg', 'mpe', 'mp4', 'm4v', 'ogv', 'webm', 'mkv', '3gp', '3gpp', '3g2', '3gp2'].includes(ext);
}

function PreviewNewFile({ file, onRemove, disabled, formatFileSize }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const name = file.name;
  const isImage = isImageFile(name, file.type);
  const isVideo = isVideoFile(name, file.type);

  return (
    <li className="file-list-item">
      <div className="file-preview-thumbnail">
        {previewUrl && isImage && (
          <img src={previewUrl} alt={name} className="preview-thumb-img" />
        )}
        {previewUrl && isVideo && (
          <video src={previewUrl} className="preview-thumb-video" muted playsInline />
        )}
        {(!previewUrl || (!isImage && !isVideo)) && (
          <div className="preview-thumb-icon">{isVideo ? 'Video' : 'PDF'}</div>
        )}
      </div>
      <div className="file-list-info">
        <span className="file-name" title={name}>{name}</span>
        <span className="file-meta">{formatFileSize(file.size)} · Ready</span>
      </div>
      {previewUrl && (
        <a href={previewUrl} target="_blank" rel="noreferrer" className="file-view-link">
          View
        </a>
      )}
      {!disabled && (
        <button
          type="button"
          className="file-remove-btn"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
        >
          ×
        </button>
      )}
    </li>
  );
}

function PreviewExistingFile({ file, onRemove, disabled, formatFileSize }) {
  const name = file.fileName || file.FileName;
  const url = getFileUrl(file.filePath || file.FilePath);
  const fileType = file.fileType || file.FileType;
  const isImage = isImageFile(name, null, fileType);
  const isVideo = isVideoFile(name, null, fileType);

  return (
    <li className="file-list-item">
      <div className="file-preview-thumbnail">
        {url && isImage && (
          <img src={url} alt={name} className="preview-thumb-img" />
        )}
        {url && isVideo && (
          <video src={url} className="preview-thumb-video" muted playsInline />
        )}
        {(!url || (!isImage && !isVideo)) && (
          <div className="preview-thumb-icon">{isVideo ? 'Video' : 'PDF'}</div>
        )}
      </div>
      <div className="file-list-info">
        <span className="file-name" title={name}>{name}</span>
        <span className="file-meta">{formatFileSize(file.fileSize || file.FileSize)} · Uploaded</span>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="file-view-link">
          View
        </a>
      )}
      {!disabled && onRemove && (
        <button
          type="button"
          className="file-remove-btn"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
        >
          ×
        </button>
      )}
    </li>
  );
}

const MAX_FILES = 5;
const MAX_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = [
  '.jpg', '.jpeg', '.jpe', '.png',
  '.pdf',
  '.asf', '.asx', '.wmv', '.wmx', '.wm', '.avi', '.divx', '.flv', '.mov', '.qt', '.mpeg', '.mpg', '.mpe', '.mp4', '.m4v', '.ogv', '.webm', '.mkv', '.3gp', '.3gpp', '.3g2', '.3gp2'
];

function isAllowedFile(file) {
  const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
  return ACCEPTED_TYPES.includes(ext);
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
  onRemoveExisting,
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
      setLocalError('File format not compatible, upload approved formats');
      return;
    }

    const oversized = fileList.find((file) => file.size > MAX_SIZE);
    if (oversized) {
      setLocalError('Reached Maximum upload limit, upload file size upto 8mb');
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
  const isInvalid = displayError || (field.required && totalCount === 0);

  return (
    <div className="form-group file-upload-group">
      <label>{field.label} {field.required && <span className="required">*</span>}</label>

      <div
        className={`file-dropzone ${isDragging ? 'dragging' : ''} ${isFull ? 'full' : ''} ${disabled ? 'disabled' : ''} ${isInvalid ? 'invalid' : ''}`}
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
          accept=".jpg,.jpeg,.jpe,.png,.pdf,.asf,.asx,.wmv,.wmx,.wm,.avi,.divx,.flv,.mov,.qt,.mpeg,.mpg,.mpe,.mp4,.m4v,.ogv,.webm,.mkv,.3gp,.3gpp,.3g2,.3gp2"
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
          Up to {MAX_FILES} files at a time &middot; PDF, PNG, JPEG or Video (MP4, MOV, AVI) &middot; 8MB each
        </p>
        <p className="file-dropzone-count">{totalCount} of {MAX_FILES} files attached</p>
      </div>

      {(existingFiles.length > 0 || selectedFiles.length > 0) && (
        <ul className="file-list">
          {existingFiles.map((file) => (
            <PreviewExistingFile
              key={`existing-${file.id || file.Id}-${file.fileName || file.FileName}`}
              file={file}
              onRemove={onRemoveExisting ? () => onRemoveExisting(field.name, file.id || file.Id) : null}
              disabled={disabled}
              formatFileSize={formatFileSize}
            />
          ))}
          {selectedFiles.map((file, idx) => (
            <PreviewNewFile
              key={`new-${file.name}-${idx}`}
              file={file}
              onRemove={() => onRemoveNew(field.name, idx)}
              disabled={disabled}
              formatFileSize={formatFileSize}
            />
          ))}
        </ul>
      )}

      {displayError && <span className="error">{displayError}</span>}
    </div>
  );
}
