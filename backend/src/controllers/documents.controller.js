class DocumentsController {
  constructor(service) {
    this.service = service;
    this.upload = this.upload.bind(this);
    this.list = this.list.bind(this);
    this.download = this.download.bind(this);
  }

  async upload(req, res, next) {
    try {
      const owner = this.getOwner(req);
      const document = await this.service.createDocument({ file: req.file, owner });
      res.status(201).json(this.service.toPublicDocument(document));
    } catch (error) {
      next(error);
    }
  }

  list(req, res, next) {
    try {
      const owner = this.getOwner(req);
      res.json({ documents: this.service.listDocuments(owner) });
    } catch (error) {
      next(error);
    }
  }

  async download(req, res, next) {
    try {
      const owner = this.getOwner(req);
      const document = await this.service.getDownload(req.params.id, owner);

      res.download(document.filePath, document.originalName, (error) => {
        if (error && !res.headersSent) {
          next(error);
        }
      });
    } catch (error) {
      next(error);
    }
  }

  getOwner(req) {
    const owner = req.get('X-User-Id');

    if (!owner || !/^[a-zA-Z0-9._:-]{1,100}$/.test(owner.trim())) {
      const error = new Error('Identificador do usuário é obrigatório e inválido.');
      error.code = 'MISSING_USER';
      error.statusCode = 400;
      throw error;
    }

    return owner.trim();
  }
}

module.exports = DocumentsController;