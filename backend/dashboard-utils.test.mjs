import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDocxBuffer,
  buildPdfBuffer,
  defaultTemplates,
  extractDocumentText,
  sanitizeEditorHtml,
} from './dashboard-utils.mjs';

test('sanitizeEditorHtml strips scripts and inline handlers', () => {
  const result = sanitizeEditorHtml('<p onclick="alert(1)">Hola</p><script>alert(2)</script>');
  assert.equal(result, '<p>Hola</p>');
});

test('extractDocumentText reads txt payloads', async () => {
  const contentBase64 = Buffer.from('Linea 1\n\nLinea 2', 'utf8').toString('base64');
  const result = await extractDocumentText({
    fileName: 'fuente.txt',
    mimeType: 'text/plain',
    size: 14,
    contentBase64,
  });

  assert.match(result.html, /<p>Linea 1<\/p>/);
  assert.equal(result.warnings.length, 0);
});

test('export builders generate binary documents', async () => {
  const report = {
    id: 'rpt-1',
    title: 'Informe de prueba',
    reference: 'REF-1',
    status: 'draft',
    templateId: defaultTemplates[0].id,
    templateName: defaultTemplates[0].name,
    classification: '',
    authorId: 'usr-1',
    authorName: 'Analista',
    authorEmail: 'analista@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: 'Analista',
    sourceDocumentHtml: '<p>Fuente</p>',
    sourceDocumentText: 'Fuente',
    sourceFile: null,
    sections: [
      {
        ...defaultTemplates[0].sections[0],
        blocks: [
          {
            id: 'blk-1',
            html: '<p>Contenido</p>',
            text: 'Contenido',
            sourceHash: 'hash-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sectionId: defaultTemplates[0].sections[0].id,
            order: 0,
          },
        ],
      },
    ],
    changeLog: [],
  };

  const pdf = await buildPdfBuffer(report);
  const docx = await buildDocxBuffer(report);

  assert.ok(pdf.length > 100);
  assert.ok(docx.length > 100);
});
