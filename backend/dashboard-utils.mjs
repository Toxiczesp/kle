import { randomUUID } from 'node:crypto';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import sanitizeHtml from 'sanitize-html';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { convert as htmlToText } from 'html-to-text';

export const reportStatuses = new Set([
  'draft',
  'review',
  'final',
]);

export const allowedEditorTags = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'a',
  'h1',
  'h2',
  'h3',
  'blockquote',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

export const sanitizeConfig = {
  allowedTags: allowedEditorTags,
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    b: 'strong',
    i: 'em',
  },
};

export const defaultDashboardSections = [
  { id: 'cover-title', title: 'PORTADA – TÍTULO.', required: true, renamable: false },
  { id: 'first-page', title: 'PRIMERA PÁGINA.', required: true, renamable: false },
  { id: 'objective', title: 'OBJETIVO.', required: true, renamable: false },
  { id: 'executive-summary', title: 'RESUMEN EJECUTIVO.', required: true, renamable: false },
  { id: 'country-profile', title: 'PERFIL DE PAÍS U ORGANISMO: ASPECTOS SOCIOLÓGICOS.', required: true, renamable: false },
  { id: 'target-authority-profile', title: 'PERFIL DE LA AUTORIDAD OBJETIVO.', required: true, renamable: false },
  { id: 'biography', title: 'Biografía personal y profesional.', required: true, renamable: false },
  { id: 'influential-people', title: 'Personas influyentes.', required: true, renamable: false },
  { id: 'expected-behavior', title: 'Comportamiento esperado de la autoridad objetivo.', required: true, renamable: false },
  { id: 'miscellaneous', title: 'Miscelánea.', required: false, renamable: false },
  { id: 'kle-guidance', title: 'ORIENTACIONES PARA LA EJECUCIÓN DEL KLE.', required: true, renamable: false },
  { id: 'supported-authority-behavior', title: 'Comportamiento recomendado de la autoridad apoyada.', required: true, renamable: false },
  { id: 'physical-human-environment', title: 'Entorno físico y humano.', required: true, renamable: false },
  { id: 'communication-deployment', title: 'Despliegue de la comunicación.', required: true, renamable: false },
  { id: 'social-program-protocol', title: 'Programa social y protocolo.', required: true, renamable: false },
  { id: 'previous-activities', title: 'Descripción de actividades previas.', required: false, renamable: false },
  { id: 'other-interesting-aspects', title: 'Otros aspectos de interés.', required: false, renamable: false },
];

export const defaultTemplates = [
  {
    id: 'tpl-standard',
    name: 'Plantilla estándar',
    description: 'Estructura recomendada para informes analíticos completos.',
    isSystem: true,
    createdBy: 'system',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    sections: defaultDashboardSections.map((section, index) => ({
      ...section,
      order: index,
      collapsed: false,
    })),
  },
  {
    id: 'tpl-empty',
    name: 'Plantilla vacía',
    description: 'Empieza desde una estructura mínima y añade apartados según necesidad.',
    isSystem: true,
    createdBy: 'system',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    sections: [],
  },
];

const defaultSectionIdOrder = defaultDashboardSections.map((section) => section.id);
const legacyDashboardSectionTitles = new Set([
  'resumen ejecutivo',
  'objeto',
  'antecedentes',
  'situacion actual',
  'situación actual',
  'analisis',
  'análisis',
  'conclusiones',
]);

const sectionTitleToDefaultId = new Map([
  ['portada - titulo.', 'cover-title'],
  ['portada – titulo.', 'cover-title'],
  ['portada - titulo', 'cover-title'],
  ['portada – titulo', 'cover-title'],
  ['portada - título.', 'cover-title'],
  ['portada – título.', 'cover-title'],
  ['portada - título', 'cover-title'],
  ['portada – título', 'cover-title'],
  ['primera pagina.', 'first-page'],
  ['primera página.', 'first-page'],
  ['primera pagina', 'first-page'],
  ['primera página', 'first-page'],
  ['objetivo.', 'objective'],
  ['objetivo', 'objective'],
  ['objeto', 'objective'],
  ['resumen ejecutivo.', 'executive-summary'],
  ['resumen ejecutivo', 'executive-summary'],
  ['perfil de pais u organismo: aspectos sociologicos.', 'country-profile'],
  ['perfil de país u organismo: aspectos sociológicos.', 'country-profile'],
  ['perfil de pais u organismo: aspectos sociologicos', 'country-profile'],
  ['perfil de país u organismo: aspectos sociológicos', 'country-profile'],
  ['situacion actual', 'country-profile'],
  ['situación actual', 'country-profile'],
  ['perfil de la autoridad objetivo.', 'target-authority-profile'],
  ['perfil de la autoridad objetivo', 'target-authority-profile'],
  ['biografia personal y profesional.', 'biography'],
  ['biografía personal y profesional.', 'biography'],
  ['biografia personal y profesional', 'biography'],
  ['biografía personal y profesional', 'biography'],
  ['personas influyentes.', 'influential-people'],
  ['personas influyentes', 'influential-people'],
  ['comportamiento esperado de la autoridad objetivo.', 'expected-behavior'],
  ['comportamiento esperado de la autoridad objetivo', 'expected-behavior'],
  ['analisis', 'expected-behavior'],
  ['análisis', 'expected-behavior'],
  ['miscelanea.', 'miscellaneous'],
  ['miscelánea.', 'miscellaneous'],
  ['miscelanea', 'miscellaneous'],
  ['miscelánea', 'miscellaneous'],
  ['orientaciones para la ejecucion del kle.', 'kle-guidance'],
  ['orientaciones para la ejecución del kle.', 'kle-guidance'],
  ['orientaciones para la ejecucion del kle', 'kle-guidance'],
  ['orientaciones para la ejecución del kle', 'kle-guidance'],
  ['comportamiento recomendado de la autoridad apoyada.', 'supported-authority-behavior'],
  ['comportamiento recomendado de la autoridad apoyada', 'supported-authority-behavior'],
  ['entorno fisico y humano.', 'physical-human-environment'],
  ['entorno físico y humano.', 'physical-human-environment'],
  ['entorno fisico y humano', 'physical-human-environment'],
  ['entorno físico y humano', 'physical-human-environment'],
  ['despliegue de la comunicacion.', 'communication-deployment'],
  ['despliegue de la comunicación.', 'communication-deployment'],
  ['despliegue de la comunicacion', 'communication-deployment'],
  ['despliegue de la comunicación', 'communication-deployment'],
  ['programa social y protocolo.', 'social-program-protocol'],
  ['programa social y protocolo', 'social-program-protocol'],
  ['descripcion de actividades previas.', 'previous-activities'],
  ['descripción de actividades previas.', 'previous-activities'],
  ['descripcion de actividades previas', 'previous-activities'],
  ['descripción de actividades previas', 'previous-activities'],
  ['antecedentes', 'previous-activities'],
  ['otros aspectos de interes.', 'other-interesting-aspects'],
  ['otros aspectos de interés.', 'other-interesting-aspects'],
  ['otros aspectos de interes', 'other-interesting-aspects'],
  ['otros aspectos de interés', 'other-interesting-aspects'],
  ['conclusiones', 'other-interesting-aspects'],
]);

export function sanitizeEditorHtml(input) {
  return sanitizeHtml(String(input || ''), sanitizeConfig).trim();
}

export function htmlToPlainText(input) {
  return htmlToText(String(input || ''), {
    wordwrap: false,
    preserveNewlines: true,
    selectors: [
      { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
    ],
  }).trim();
}

export function createTemplateFromInput(input, user) {
  const now = new Date().toISOString();
  const name = String(input.name || '').trim();
  const description = String(input.description || '').trim();
  const sections = normalizeTemplateSections(input.sections);

  if (!name) {
    throw new Error('La plantilla debe tener nombre.');
  }

  return {
    id: `tpl-${randomUUID()}`,
    name,
    description,
    isSystem: false,
    createdBy: user.id,
    createdAt: now,
    updatedAt: now,
    sections,
  };
}

export function createReportFromTemplate(input, template, user) {
  const now = new Date().toISOString();
  const status = normalizeReportStatus(input.status);
  return {
    id: `rpt-${randomUUID()}`,
    title: String(input.title || 'Nuevo informe').trim() || 'Nuevo informe',
    reference: String(input.reference || '').trim(),
    status,
    templateId: template.id,
    templateName: template.name,
    classification: String(input.classification || '').trim(),
    authorId: user.id,
    authorName: user.name,
    authorEmail: user.email,
    createdAt: now,
    updatedAt: now,
    lastModifiedAt: now,
    lastModifiedBy: user.name,
    sourceDocumentHtml: sanitizeEditorHtml(input.sourceDocumentHtml),
    sourceDocumentText: htmlToPlainText(input.sourceDocumentHtml),
    sourceFile: normalizeSourceFile(input.sourceFile, now),
    sections: materializeSections(template.sections),
    changeLog: [
      createChangeLogEntry('report_created', `Informe creado por ${user.name}.`, now),
    ],
  };
}

export function updateReportFromInput(report, input, user) {
  const now = new Date().toISOString();
  return {
    ...report,
    title: String(input.title || '').trim() || report.title,
    reference: String(input.reference || '').trim(),
    status: normalizeReportStatus(input.status),
    classification: String(input.classification || '').trim(),
    templateId: String(input.templateId || report.templateId),
    templateName: String(input.templateName || report.templateName),
    sourceDocumentHtml: sanitizeEditorHtml(input.sourceDocumentHtml),
    sourceDocumentText: htmlToPlainText(input.sourceDocumentHtml),
    sourceFile: normalizeSourceFile(input.sourceFile, now),
    sourceDocuments: input.sourceDocuments !== undefined ? input.sourceDocuments : report.sourceDocuments,
    activeSourceDocumentId: input.activeSourceDocumentId !== undefined ? input.activeSourceDocumentId : report.activeSourceDocumentId,
    sections: normalizeReportSections(input.sections),
    updatedAt: now,
    lastModifiedAt: now,
    lastModifiedBy: user.name,
    changeLog: appendChangeLog(report.changeLog, createChangeLogEntry(
      input.autoSaved ? 'autosave' : 'manual_save',
      input.autoSaved ? 'Autoguardado completado.' : 'Borrador guardado manualmente.',
      now
    )),
  };
}

export function duplicateReport(report, user) {
  const now = new Date().toISOString();
  return {
    ...report,
    id: `rpt-${randomUUID()}`,
    title: `${report.title} (copia)`,
    createdAt: now,
    updatedAt: now,
    lastModifiedAt: now,
    lastModifiedBy: user.name,
    authorId: user.id,
    authorName: user.name,
    authorEmail: user.email,
    sections: normalizeReportSections(report.sections, true),
    changeLog: [
      createChangeLogEntry('report_duplicated', `Informe duplicado por ${user.name}.`, now),
    ],
  };
}

function normalizeReportStatus(status) {
  return reportStatuses.has(status) ? status : 'draft';
}

function normalizeSourceFile(file, fallbackDate) {
  if (!file || typeof file !== 'object') {
    return null;
  }

  return {
    name: String(file.name || '').trim(),
    mimeType: String(file.mimeType || '').trim(),
    size: Number(file.size || 0),
    lastModified: Number(file.lastModified || 0),
    uploadedAt: String(file.uploadedAt || fallbackDate),
    extractionWarnings: Array.isArray(file.extractionWarnings)
      ? file.extractionWarnings.map((item) => String(item))
      : [],
  };
}

function normalizeTemplateSections(sections) {
  if (!Array.isArray(sections)) {
    return [];
  }

  return sections.map((section, index) => ({
    id: String(section.id || `section-${index + 1}`),
    title: String(section.title || `Apartado ${index + 1}`).trim(),
    required: Boolean(section.required),
    renamable: section.renamable !== false,
    collapsed: Boolean(section.collapsed),
    order: index,
  }));
}

function materializeSections(sections) {
  return normalizeTemplateSections(sections).map((section) => ({
    ...section,
    blocks: [],
  }));
}

function normalizeBlock(block, sectionId, index, regenerateIds = false) {
  const html = sanitizeEditorHtml(block?.html);
  const now = new Date().toISOString();
  return {
    id: regenerateIds || !block?.id ? `blk-${randomUUID()}` : String(block.id),
    html,
    text: htmlToPlainText(html),
    sourceHash: String(block?.sourceHash || ''),
    createdAt: String(block?.createdAt || now),
    updatedAt: String(block?.updatedAt || now),
    sectionId,
    order: index,
  };
}

export function normalizeReportSections(sections, regenerateIds = false) {
  if (!Array.isArray(sections)) {
    return materializeSections(defaultTemplates[0].sections);
  }

  const normalizedSections = sections.map((section, sectionIndex) => ({
    id: String(section.id || `section-${sectionIndex + 1}`),
    title: String(section.title || `Apartado ${sectionIndex + 1}`).trim(),
    required: Boolean(section.required),
    renamable: section.renamable !== false,
    collapsed: Boolean(section.collapsed),
    order: sectionIndex,
    blocks: Array.isArray(section.blocks)
      ? section.blocks.map((block, blockIndex) => normalizeBlock(
          block,
          String(section.id || `section-${sectionIndex + 1}`),
          blockIndex,
          regenerateIds
        ))
      : [],
  }));

  return migrateLegacyDashboardSections(normalizedSections, regenerateIds);
}

function migrateLegacyDashboardSections(sections, regenerateIds) {
  const normalizedTitles = sections.map((section) => normalizeSectionTitle(section.title));
  const legacyMatches = normalizedTitles.filter((title) => legacyDashboardSectionTitles.has(title)).length;
  const alreadyStructured = sections.every((section) => defaultSectionIdOrder.includes(section.id));

  if (legacyMatches < 3 && !alreadyStructured) {
    return sections;
  }

  if (legacyMatches === 0 && alreadyStructured) {
    return sections;
  }

  const defaultSectionMap = new Map(
    materializeSections(defaultTemplates[0].sections).map((section) => [section.id, section])
  );

  for (const section of sections) {
    const normalizedTitle = normalizeSectionTitle(section.title);
    const targetId = sectionTitleToDefaultId.get(normalizedTitle) || section.id;
    const targetSection = defaultSectionMap.get(targetId) || defaultSectionMap.get('miscellaneous');
    if (!targetSection) {
      continue;
    }

    const existingBlocks = targetSection.blocks.length;
    const migratedBlocks = section.blocks.map((block, index) => normalizeBlock(
      {
        ...block,
        sectionId: targetSection.id,
        order: existingBlocks + index,
      },
      targetSection.id,
      existingBlocks + index,
      regenerateIds
    ));

    targetSection.blocks = [...targetSection.blocks, ...migratedBlocks];
  }

  return defaultTemplates[0].sections.map((templateSection, index) => {
    const section = defaultSectionMap.get(templateSection.id);
    return {
      ...section,
      order: index,
      collapsed: Boolean(section?.collapsed),
      blocks: Array.isArray(section?.blocks)
        ? section.blocks.map((block, blockIndex) => ({
            ...block,
            sectionId: templateSection.id,
            order: blockIndex,
          }))
        : [],
    };
  });
}

function normalizeSectionTitle(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function appendChangeLog(entries, entry) {
  const list = Array.isArray(entries) ? entries : [];
  return [entry, ...list].slice(0, 20);
}

function createChangeLogEntry(type, message, at) {
  return {
    id: `chg-${randomUUID()}`,
    type,
    message,
    at,
  };
}

const supportedFileTypes = {
  '.txt': ['text/plain'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
  ],
  '.pdf': ['application/pdf'],
};

export function validateDocumentFile({ fileName, mimeType, size }) {
  const extension = getFileExtension(fileName);
  const supportedMimeTypes = supportedFileTypes[extension];

  if (!supportedMimeTypes) {
    throw new Error('Formato no permitido. Solo se admiten TXT, DOCX y PDF.');
  }

  if (Number(size || 0) > 10 * 1024 * 1024) {
    throw new Error('El archivo supera el tamaño máximo permitido de 10 MB.');
  }

  if (mimeType && !supportedMimeTypes.includes(mimeType)) {
    if (!(extension === '.docx' && mimeType.includes('officedocument'))) {
      throw new Error('El tipo MIME del archivo no coincide con un formato permitido.');
    }
  }

  return extension;
}

function getFileExtension(fileName) {
  const value = String(fileName || '').toLowerCase();
  if (value.endsWith('.txt')) {
    return '.txt';
  }
  if (value.endsWith('.docx')) {
    return '.docx';
  }
  if (value.endsWith('.pdf')) {
    return '.pdf';
  }
  return '';
}

export async function extractDocumentText({ fileName, mimeType, size, contentBase64 }) {
  const extension = validateDocumentFile({ fileName, mimeType, size });
  const fileBuffer = Buffer.from(String(contentBase64 || ''), 'base64');
  const warnings = [];
  let html = '';

  if (extension === '.txt') {
    const text = fileBuffer.toString('utf8');
    html = paragraphsToHtml(text);
  }

  if (extension === '.docx') {
    const result = await mammoth.convertToHtml({ buffer: fileBuffer });
    html = sanitizeEditorHtml(result.value);
    warnings.push(...result.messages.map((message) => message.message));
  }

  if (extension === '.pdf') {
    const parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText();
    await parser.destroy();
    const text = String(result.text || '').trim();
    html = paragraphsToHtml(text);
    if (!text) {
      warnings.push('El PDF no contiene texto extraíble. No hay OCR disponible en este proyecto.');
    }
  }

  return {
    html,
    text: htmlToPlainText(html),
    warnings,
    file: {
      name: fileName,
      mimeType,
      size,
      lastModified: Date.now(),
      uploadedAt: new Date().toISOString(),
      extractionWarnings: warnings,
    },
  };
}

function paragraphsToHtml(text) {
  const cleaned = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!cleaned) {
    return '';
  }

  return cleaned
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderReportLines(report) {
  const lines = [
    report.title,
    report.reference ? `Referencia: ${report.reference}` : '',
    `Estado: ${report.status}`,
    `Autor: ${report.authorName}`,
    `Fecha de creación: ${new Date(report.createdAt).toLocaleString('es-ES')}`,
    `Última modificación: ${new Date(report.updatedAt).toLocaleString('es-ES')}`,
    '',
  ];

  for (const [index, section] of report.sections.entries()) {
    lines.push(`${index + 1}. ${section.title}`);
    if (section.blocks.length === 0) {
      lines.push('Sin contenido.');
      lines.push('');
      continue;
    }

    for (const block of section.blocks) {
      lines.push(block.text || ' ');
      lines.push('');
    }
  }

  return lines;
}

export async function buildPdfBuffer(report) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]);
  const margin = 50;
  const fontSize = 11;
  const lineHeight = 16;
  let cursorY = page.getHeight() - margin;
  const lines = renderReportLines(report);

  const writeLine = (text, options = {}) => {
    const activeFont = options.bold ? boldFont : font;
    const size = options.size || fontSize;
    const wrapped = wrapText(text, 78);

    for (const item of wrapped) {
      if (cursorY <= margin) {
        page = pdf.addPage([595.28, 841.89]);
        cursorY = page.getHeight() - margin;
      }

      page.drawText(item, {
        x: margin,
        y: cursorY,
        size,
        font: activeFont,
        color: rgb(0.12, 0.17, 0.28),
      });
      cursorY -= lineHeight;
    }
  };

  writeLine(report.title, { bold: true, size: 18 });
  cursorY -= 8;

  for (const line of lines.slice(1)) {
    if (/^\d+\.\s/.test(line)) {
      cursorY -= 6;
      writeLine(line, { bold: true, size: 13 });
      continue;
    }
    writeLine(line || ' ');
  }

  return Buffer.from(await pdf.save());
}

function wrapText(text, maxChars) {
  if (!text) {
    return [''];
  }

  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [''];
}

export async function buildDocxBuffer(report) {
  const children = [
    new Paragraph({
      text: report.title,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Referencia: ${report.reference || 'Sin referencia'}`, bold: true }),
      ],
    }),
    new Paragraph({
      text: `Estado: ${report.status} | Autor: ${report.authorName} | Actualizado: ${new Date(report.updatedAt).toLocaleString('es-ES')}`,
    }),
  ];

  for (const [index, section] of report.sections.entries()) {
    children.push(
      new Paragraph({
        text: `${index + 1}. ${section.title}`,
        heading: HeadingLevel.HEADING_1,
      })
    );

    if (section.blocks.length === 0) {
      children.push(new Paragraph('Sin contenido.'));
      continue;
    }

    for (const block of section.blocks) {
      const blockLines = (block.text || '').split('\n').map((line) => line.trim()).filter(Boolean);
      if (blockLines.length === 0) {
        children.push(new Paragraph(' '));
        continue;
      }

      for (const line of blockLines) {
        children.push(new Paragraph(line));
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
