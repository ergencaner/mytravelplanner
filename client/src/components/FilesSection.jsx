import { api } from '../api';
import FileUpload from './FileUpload';

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const entityLabels = { plan: '📁 General', accommodation: '🏨 Accommodation', transport: '🚀 Transport', place: '🗺️ Place', restaurant: '🍽️ Restaurant' };

export default function FilesSection({ plan, files, onRefresh }) {
  const handleDelete = async (id) => {
    if (!confirm('Delete this file?')) return;
    await api.deleteFile(id);
    onRefresh();
  };

  const grouped = files.reduce((acc, f) => {
    const key = f.entity_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  const isImage = (f) => f.mime_type?.startsWith('image/');
  const isPdf = (f) => f.mime_type === 'application/pdf';

  return (
    <div>
      <div className="section-header">
        <h3>📎 All Files & Documents</h3>
        <span className="text-muted text-small">{files.length} file(s)</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p className="text-muted text-small" style={{ marginBottom: 8 }}>Upload general trip documents (tickets, reservations, etc.)</p>
        <FileUpload planId={plan.id} entityType="plan" onUploaded={onRefresh} />
      </div>

      {files.length === 0 && <p className="text-muted text-small">No files uploaded yet.</p>}

      {Object.entries(grouped).map(([type, groupFiles]) => (
        <div key={type} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>{entityLabels[type] || type}</div>
          <div className="files-grid">
            {groupFiles.map(f => (
              <div key={f.id} className="file-card">
                <div className="file-preview">
                  {isImage(f)
                    ? <img src={`/uploads/${f.filename}`} alt={f.original_name} />
                    : <span className="file-icon">{isPdf(f) ? '📄' : '📎'}</span>
                  }
                </div>
                <div className="file-info">
                  <div className="file-name" title={f.original_name}>{f.original_name}</div>
                  <div className="file-meta">{formatSize(f.file_size)}</div>
                  <div className="file-actions">
                    <a href={`/uploads/${f.filename}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View</a>
                    <a href={`/uploads/${f.filename}`} download={f.original_name} className="btn btn-outline btn-sm">⬇</a>
                    <button className="btn-icon danger" onClick={() => handleDelete(f.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
