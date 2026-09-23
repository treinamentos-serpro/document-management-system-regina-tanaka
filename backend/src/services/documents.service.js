const path = require('node:path');

class DocumentsService {
  constructor(repository) {
    this.repository = repository;
  }

  createDocument({ file, owner }) {
    if (!file) {
      throw this.createError('MISSING_FILE', 'Arquivo não enviado.', 400);
    }

    const document = {
      id: path.parse(file.filename).name,
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
      filePath: file.path,
      mimeType: file.mimetype,
    };

    try {
      return this.repository.save(document);
    } catch (error) {
      return this.removeOrphanAndThrow(file.path, error);
    }
  }

  listDocuments(owner) {
    return this.repository.findByOwner(owner).map((document) => this.toPublicDocument(document));
  }

  getDownload(id, owner) {
    const document = this.repository.findById(id);

    if (!document || document.owner !== owner) {
      throw this.createError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.', 404);
    }

    return document;
  }

  toPublicDocument(document) {
    return {
      id: document.id,
      originalName: document.originalName,
      size: document.size,
      uploadedAt: document.uploadedAt,
      owner: document.owner,
    };
  }

  removeOrphanAndThrow(filePath, error) {
    this.repository.removeFile(filePath).catch(() => {});
    throw this.createError('UPLOAD_FAILED', 'Não foi possível salvar o documento.', 500, error);
  }

  createError(code, message, statusCode, cause) {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    error.cause = cause;
    return error;
  }
}

module.exports = DocumentsService;