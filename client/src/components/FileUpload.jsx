import { useState, useRef } from 'react';
import { api } from '../api';

export default function FileUpload({ planId, entityType, entityId, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      for (const file of files) {
        const uploaded = await api.uploadFile(planId, file, entityType, entityId);
        onUploaded?.(uploaded);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(Array.from(e.dataTransfer.files)); }}
      >
        <div style={{ fontSize: '2rem' }}>📎</div>
        <p>{uploading ? 'Uploading...' : 'Click or drag files here to upload (PDFs, images, etc.)'}</p>
        <p style={{ fontSize: '0.75rem', marginTop: 4 }}>Max 50MB per file</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(Array.from(e.target.files))}
      />
      {error && <div className="alert alert-error mt-2">{error}</div>}
    </div>
  );
}
