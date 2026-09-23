import { useCallback, useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { downloadDocument, listDocuments, uploadDocument } from './services/api.js';
import './App.css';

export default function App() {
  const [userId, setUserId] = useState('demo-user');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDocuments = useCallback(async (signal) => {
    if (signal?.aborted) return;

    setIsLoading(true);
    setError('');

    try {
      setDocuments(await listDocuments(userId, signal));
    } catch (loadError) {
      if (loadError.name === 'AbortError') return;
      setError(loadError.message);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    loadDocuments(controller.signal);
    return () => controller.abort();
  }, [loadDocuments]);

  async function handleUpload(file) {
    await uploadDocument(file, userId);
    await loadDocuments();
  }

  async function handleDownload(documentId) {
    try {
      return await downloadDocument(documentId, userId);
    } catch (downloadError) {
      setError(downloadError.message);
      throw downloadError;
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="brand-mark">DMS / workspace</p>
          <h1>Documentos em um só lugar.</h1>
          <p className="header-copy">Envie, organize e recupere seus arquivos com simplicidade.</p>
        </div>
        <label className="user-field">
          <span>Usuário</span>
          <input value={userId} onChange={(event) => setUserId(event.target.value)} aria-label="Usuário" />
        </label>
      </header>

      <div className="content-grid">
        <UploadComponent onUpload={handleUpload} disabled={!userId.trim()} />
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          error={error}
          onRefresh={() => loadDocuments()}
          onDownload={handleDownload}
        />
      </div>
    </main>
  );
}
