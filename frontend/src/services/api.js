const API_PREFIX = '/api';

async function parseResponse(response) {
  if (response.ok) {
    return response;
  }

  let message = 'Não foi possível concluir a operação.';

  try {
    const payload = await response.json();
    message = payload.error?.message || message;
  } catch {
    message = response.statusText || message;
  }

  const error = new Error(message);
  error.status = response.status;
  throw error;
}

export async function listDocuments(userId) {
  const response = await fetch(`${API_PREFIX}/documents`, {
    headers: { 'X-User-Id': userId },
  });

  await parseResponse(response);
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file, userId) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: formData,
  });

  await parseResponse(response);
  return response.json();
}

export async function downloadDocument(documentId, userId) {
  const response = await fetch(`${API_PREFIX}/documents/${documentId}/download`, {
    headers: { 'X-User-Id': userId },
  });

  await parseResponse(response);
  return {
    blob: await response.blob(),
    fileName: getFileName(response.headers.get('Content-Disposition')),
  };
}

function getFileName(contentDisposition) {
  const match = contentDisposition?.match(/filename="([^"]+)"/i);
  return match?.[1] || 'documento';
}