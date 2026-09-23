const fs = require('node:fs/promises');
const path = require('node:path');

class DocumentsRepository {
  constructor(storageDirectory) {
    this.documents = new Map();
    this.storageDirectory = path.resolve(storageDirectory);
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

  async isAvailable(filePath) {
    const relativePath = path.relative(this.storageDirectory, path.resolve(filePath));

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return false;
    }

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = DocumentsRepository;