import { useRef, useState } from 'react';

export default function UploadComponent({ onUpload, disabled = false }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  function handleFileChange(event) {
    setSelectedFile(event.target.files[0] || null);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      inputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-panel" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Novo documento</p>
        <h2>Envie um arquivo</h2>
        <p className="muted">Escolha um documento para adicioná-lo à sua biblioteca.</p>
      </div>
      <label className="file-picker">
        <span>{selectedFile?.name || 'Selecionar arquivo'}</span>
        <input ref={inputRef} type="file" onChange={handleFileChange} disabled={disabled || isUploading} />
      </label>
      <button className="primary-button" type="submit" disabled={disabled || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}