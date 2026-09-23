import { useState } from 'react';

export default function DownloadButton({ document, onDownload }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);

    try {
      const { blob, fileName } = await onDownload(document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = fileName || document.originalName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      return;
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button className="secondary-button" type="button" onClick={handleDownload} disabled={isDownloading}>
      {isDownloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}