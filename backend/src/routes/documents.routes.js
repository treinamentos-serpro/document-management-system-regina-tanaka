const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const DocumentsRepository = require('../repositories/documents.repository');
const DocumentsService = require('../services/documents.service');
const DocumentsController = require('../controllers/documents.controller');

const storageDirectory = path.resolve(process.env.STORAGE_DIR || path.resolve(__dirname, '../../storage'));
fs.mkdirSync(storageDirectory, { recursive: true });

const allowedMimeTypes = (process.env.ALLOWED_MIME_TYPES || '')
  .split(',')
  .map((mimeType) => mimeType.trim())
  .filter(Boolean);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, storageDirectory),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024),
  },
  fileFilter: (_req, file, callback) => {
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.mimetype)) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
    }

    return callback(null, true);
  },
});

const repository = new DocumentsRepository(storageDirectory);
const service = new DocumentsService(repository);
const controller = new DocumentsController(service);
const router = express.Router();

function requireUser(req, _res, next) {
  const owner = req.get('X-User-Id');

  if (!owner || !/^[a-zA-Z0-9._:-]{1,100}$/.test(owner.trim())) {
    const error = new Error('Identificador do usuário é obrigatório e inválido.');
    error.code = 'MISSING_USER';
    error.statusCode = 400;
    return next(error);
  }

  return next();
}

router.post('/upload', requireUser, upload.single('file'), controller.upload);
router.get('/documents', requireUser, controller.list);
router.get('/documents/:id/download', requireUser, controller.download);

module.exports = router;