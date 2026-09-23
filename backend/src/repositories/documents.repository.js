const fs = require('node:fs/promises');

class DocumentsRepository {
  constructor() {
    this.documents = new Map();
  }

  save(document) {
    this.documents.set(document.id, document);
    return document;
  }

  findByOwner(owner) {
    return [...this.documents.values()]
      .filter((document) => document.owner === owner)
      .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt));
  }

  findById(id) {
    return this.documents.get(id);
  }

  async removeFile(filePath) {
    await fs.rm(filePath, { force: true });
  }
}

module.exports = DocumentsRepository;