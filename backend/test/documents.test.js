const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const app = require('../src/app');

const storageDirectory = path.resolve(__dirname, '../storage');
let server;
let port;
let uploadedDocument;

function request(pathname, options = {}) {
  return fetch(`http://127.0.0.1:${port}${pathname}`, options);
}

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));

  if (!uploadedDocument) return;

  const files = await fs.readdir(storageDirectory);
  await Promise.all(
    files
      .filter((fileName) => fileName.startsWith(uploadedDocument.id))
      .map((fileName) => fs.rm(path.join(storageDirectory, fileName), { force: true }))
  );
});

test('faz upload, lista e baixa um documento do usuário', async () => {
  const owner = `integration-user-${Date.now()}`;
  const formData = new FormData();
  formData.append('file', new Blob(['conteúdo do teste'], { type: 'text/plain' }), 'integration.txt');

  const uploadResponse = await request('/upload', {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: formData,
  });

  assert.equal(uploadResponse.status, 201);
  uploadedDocument = await uploadResponse.json();
  assert.equal(uploadedDocument.originalName, 'integration.txt');
  assert.equal(uploadedDocument.owner, owner);

  const listResponse = await request('/documents', {
    headers: { 'X-User-Id': owner },
  });

  assert.equal(listResponse.status, 200);
  const listPayload = await listResponse.json();
  assert.deepEqual(listPayload.documents, [uploadedDocument]);

  const downloadResponse = await request(`/documents/${uploadedDocument.id}/download`, {
    headers: { 'X-User-Id': owner },
  });

  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), 'conteúdo do teste');
});

test('não lista nem baixa documentos de outro usuário', async () => {
  assert.ok(uploadedDocument);

  const listResponse = await request('/documents', {
    headers: { 'X-User-Id': 'another-user' },
  });
  assert.equal(listResponse.status, 200);
  assert.deepEqual((await listResponse.json()).documents, []);

  const downloadResponse = await request(`/documents/${uploadedDocument.id}/download`, {
    headers: { 'X-User-Id': 'another-user' },
  });
  assert.equal(downloadResponse.status, 404);
});
