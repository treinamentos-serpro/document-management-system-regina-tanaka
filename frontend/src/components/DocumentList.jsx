import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function DocumentList({ documents, isLoading, error, onRefresh, onDownload }) {
  return (
    <section className="documents-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Sua biblioteca</p>
          <h2>Documentos recentes</h2>
        </div>
        <button className="text-button" type="button" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {isLoading && <p className="empty-state">Carregando documentos...</p>}
      {!isLoading && !error && documents.length === 0 && (
        <p className="empty-state">Nenhum documento enviado ainda.</p>
      )}
      {!isLoading && !error && documents.length > 0 && (
        <div className="document-list">
          {documents.map((document) => (
            <article className="document-row" key={document.id}>
              <div className="document-icon" aria-hidden="true">DOC</div>
              <div className="document-details">
                <strong>{document.originalName}</strong>
                <span>{formatFileSize(document.size)} · {formatDate(document.uploadedAt)}</span>
              </div>
              <DownloadButton document={document} onDownload={onDownload} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}