import { createServer } from 'node:http';
import { promises as fs, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { exec } from 'node:child_process';

// ── Load .env.local into process.env (dotenv-lite) ──
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

for (const envFile of ['.env.local', '.env']) {
  const envPath = path.join(rootDir, envFile);
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex < 0) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

import { defaultAuthorityData, defaultUsers } from './seed-data.mjs';
import {
  buildDocxBuffer,
  buildPdfBuffer,
  createReportFromTemplate,
  createTemplateFromInput,
  defaultTemplates,
  duplicateReport,
  extractDocumentText,
  normalizeReportSections,
  sanitizeEditorHtml,
  updateReportFromInput,
} from './dashboard-utils.mjs';

const dataDir = process.env.HOME
  ? path.join(process.env.HOME, 'kle-data')
  : path.join(rootDir, 'server-data');

const usersFile = path.join(dataDir, 'users.json');
const sessionsFile = path.join(dataDir, 'sessions.json');
const authorityDataFile = path.join(dataDir, 'authority-data.json');
const dashboardReportsFile = path.join(dataDir, 'dashboard-reports.json');
const dashboardTemplatesFile = path.join(dataDir, 'dashboard-templates.json');

const PORT = Number(process.env.PORT || process.env.KLE_API_PORT || 3001);

async function ensureFile(filePath, initialValue) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(initialValue, null, 2), 'utf8');
  }
}

async function bootstrap() {
  await ensureFile(usersFile, defaultUsers);
  await ensureFile(sessionsFile, []);
  await ensureFile(authorityDataFile, defaultAuthorityData);
  await ensureFile(dashboardReportsFile, []);
  await ensureFile(dashboardTemplatesFile, defaultTemplates);
  await syncSystemTemplates();
}

async function syncSystemTemplates() {
  const storedTemplates = await readJson(dashboardTemplatesFile);
  const customTemplates = storedTemplates.filter((template) => !template.isSystem);
  const nextTemplates = [
    ...defaultTemplates,
    ...customTemplates,
  ];

  const changed = JSON.stringify(storedTemplates) !== JSON.stringify(nextTemplates);
  if (changed) {
    await writeJson(dashboardTemplatesFile, nextTemplates);
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  });

  if (statusCode === 204) {
    res.end();
    return;
  }

  res.end(JSON.stringify(payload));
}

function sendBinary(res, statusCode, buffer, contentType, fileName) {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': buffer.length,
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  });
  res.end(buffer);
}

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function getSessionUser(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return null;
  }

  const sessions = await readJson(sessionsFile);
  const session = sessions.find((item) => item.token === token);
  if (!session) {
    return null;
  }

  const users = await readJson(usersFile);
  const user = users.find((item) => item.email === session.email);
  return user ? sanitizeUser(user) : null;
}

function requireAnalystUser(user) {
  return Boolean(user && user.role === 'analista');
}

const authoritySections = new Set([
  'requests',
  'evaluations',
  'publishedProfiles',
  'sharedDocuments',
  'dossierEvaluations',
  'observationQuestionnaires',
]);

function parseDashboardId(pathname) {
  const match = pathname.match(/^\/api\/dashboard\/reports\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function parseDashboardAction(pathname, action) {
  const match = pathname.match(new RegExp(`^/api/dashboard/reports/([^/]+)/${action}$`));
  return match ? decodeURIComponent(match[1]) : null;
}

function normalizeReportForResponse(report) {
  return {
    ...report,
    sourceDocumentHtml: sanitizeEditorHtml(report.sourceDocumentHtml),
    sections: normalizeReportSections(report.sections),
  };
}

function ensureTemplateExists(templates, templateId) {
  return templates.find((template) => template.id === templateId) || templates[0];
}

await bootstrap();

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 404, { error: 'Ruta no válida.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (req.method === 'GET' && url.pathname === '/') {
      sendJson(res, 200, { status: 'ok', service: 'KLE API' });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      sendJson(res, 200, {
        status: 'ok',
        service: 'KLE API',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await parseBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const users = await readJson(usersFile);

      const found = users.find(
        (item) => item.email.toLowerCase() === email && item.passwordHash === hashPassword(password)
      );

      if (!found) {
        sendJson(res, 401, { error: 'Credenciales no válidas.' });
        return;
      }

      const sessions = await readJson(sessionsFile);
      const token = randomUUID();
      const nextSessions = [
        ...sessions.filter((item) => item.email !== found.email),
        { token, email: found.email, createdAt: new Date().toISOString() },
      ];
      await writeJson(sessionsFile, nextSessions);
      sendJson(res, 200, { token, user: sanitizeUser(found) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/register') {
      const body = await parseBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const role = body.role === 'autoridad' ? 'autoridad' : 'analista';

      if (!name || !email || password.length < 6) {
        sendJson(res, 400, { error: 'Datos de registro no válidos.' });
        return;
      }

      const users = await readJson(usersFile);
      if (users.some((item) => item.email.toLowerCase() === email)) {
        sendJson(res, 409, { error: 'Ya existe un usuario con ese correo.' });
        return;
      }

      const newUser = {
        id: `usr-${Date.now()}`,
        name,
        email,
        passwordHash: hashPassword(password),
        role,
      };

      await writeJson(usersFile, [...users, newUser]);
      const sessions = await readJson(sessionsFile);
      const token = randomUUID();
      await writeJson(sessionsFile, [
        ...sessions.filter((item) => item.email !== email),
        { token, email, createdAt: new Date().toISOString() },
      ]);
      sendJson(res, 201, { token, user: sanitizeUser(newUser) });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/auth/session') {
      const user = await getSessionUser(req);
      if (!user) {
        sendJson(res, 401, { error: 'Sesión no válida.' });
        return;
      }

      sendJson(res, 200, { user });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const sessions = await readJson(sessionsFile);
      await writeJson(sessionsFile, sessions.filter((item) => item.token !== token));
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/authority-data') {
      const user = await getSessionUser(req);
      if (!user) {
        sendJson(res, 401, { error: 'No autorizado.' });
        return;
      }

      const data = await readJson(authorityDataFile);
      sendJson(res, 200, data);
      return;
    }

    if (req.method === 'PUT' && url.pathname.startsWith('/api/authority-data/')) {
      const user = await getSessionUser(req);
      if (!user) {
        sendJson(res, 401, { error: 'No autorizado.' });
        return;
      }

      const section = url.pathname.replace('/api/authority-data/', '');
      if (!authoritySections.has(section)) {
        sendJson(res, 404, { error: 'Sección no encontrada.' });
        return;
      }

      const body = await parseBody(req);
      if (!Array.isArray(body.items)) {
        sendJson(res, 400, { error: 'Carga no válida.' });
        return;
      }

      const data = await readJson(authorityDataFile);
      data[section] = body.items;
      await writeJson(authorityDataFile, data);
      sendJson(res, 200, { ok: true, items: data[section] });
      return;
    }

    if (url.pathname.startsWith('/api/dashboard/')) {
      const user = await getSessionUser(req);
      if (!user) {
        sendJson(res, 401, { error: 'No autorizado.' });
        return;
      }

      if (!requireAnalystUser(user)) {
        sendJson(res, 403, { error: 'Solo el perfil de analista puede gestionar informes.' });
        return;
      }

      const reports = await readJson(dashboardReportsFile);
      const templates = await readJson(dashboardTemplatesFile);

      if (req.method === 'GET' && url.pathname === '/api/dashboard/templates') {
        sendJson(res, 200, { items: templates });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/dashboard/templates') {
        const body = await parseBody(req);
        const template = createTemplateFromInput(body, user);
        const nextTemplates = [...templates, template];
        await writeJson(dashboardTemplatesFile, nextTemplates);
        sendJson(res, 201, { item: template });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/dashboard/extract-document') {
        const body = await parseBody(req);
        const extracted = await extractDocumentText(body);
        sendJson(res, 200, extracted);
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/dashboard/reports') {
        const search = String(url.searchParams.get('search') || '').trim().toLowerCase();
        const status = String(url.searchParams.get('status') || '').trim();
        const scoped = reports
          .filter((report) => report.authorId === user.id)
          .filter((report) => !status || report.status === status)
          .filter((report) => {
            if (!search) {
              return true;
            }
            return [report.title, report.reference, report.templateName]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(search));
          })
          .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

        sendJson(res, 200, {
          items: scoped.map((report) => ({
            id: report.id,
            title: report.title,
            reference: report.reference,
            status: report.status,
            templateId: report.templateId,
            templateName: report.templateName,
            authorName: report.authorName,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            sourceFile: report.sourceFile,
            sectionCount: Array.isArray(report.sections) ? report.sections.length : 0,
          })),
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/dashboard/reports') {
        const body = await parseBody(req);
        const template = ensureTemplateExists(templates, body.templateId);
        const report = createReportFromTemplate(body, template, user);
        const nextReports = [...reports, report];
        await writeJson(dashboardReportsFile, nextReports);
        sendJson(res, 201, { item: normalizeReportForResponse(report) });
        return;
      }

      const duplicateId = parseDashboardAction(url.pathname, 'duplicate');
      if (req.method === 'POST' && duplicateId) {
        const sourceReport = reports.find((item) => item.id === duplicateId && item.authorId === user.id);
        if (!sourceReport) {
          sendJson(res, 404, { error: 'Informe no encontrado.' });
          return;
        }
        const duplicated = duplicateReport(sourceReport, user);
        const nextReports = [...reports, duplicated];
        await writeJson(dashboardReportsFile, nextReports);
        sendJson(res, 201, { item: normalizeReportForResponse(duplicated) });
        return;
      }

      const exportId = parseDashboardAction(url.pathname, 'export');
      if (req.method === 'GET' && exportId) {
        const report = reports.find((item) => item.id === exportId && item.authorId === user.id);
        if (!report) {
          sendJson(res, 404, { error: 'Informe no encontrado.' });
          return;
        }

        const format = String(url.searchParams.get('format') || 'pdf');
        const safeReport = normalizeReportForResponse(report);
        const fileBaseName = safeReport.title.replace(/[^\p{L}\p{N}\-_]+/gu, '-').slice(0, 60) || 'informe';

        if (format === 'docx') {
          const buffer = await buildDocxBuffer(safeReport);
          sendBinary(
            res,
            200,
            buffer,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            `${fileBaseName}.docx`
          );
          return;
        }

        const buffer = await buildPdfBuffer(safeReport);
        sendBinary(res, 200, buffer, 'application/pdf', `${fileBaseName}.pdf`);
        return;
      }

      const reportId = parseDashboardId(url.pathname);
      if (reportId) {
        const currentReport = reports.find((item) => item.id === reportId && item.authorId === user.id);
        if (!currentReport) {
          sendJson(res, 404, { error: 'Informe no encontrado.' });
          return;
        }

        if (req.method === 'GET') {
          sendJson(res, 200, { item: normalizeReportForResponse(currentReport) });
          return;
        }

        if (req.method === 'PUT') {
          const body = await parseBody(req);
          const nextReport = updateReportFromInput(currentReport, body, user);
          const nextReports = reports.map((item) => (item.id === currentReport.id ? nextReport : item));
          await writeJson(dashboardReportsFile, nextReports);
          sendJson(res, 200, { item: normalizeReportForResponse(nextReport) });
          return;
        }

        if (req.method === 'DELETE') {
          await writeJson(
            dashboardReportsFile,
            reports.filter((item) => item.id !== currentReport.id)
          );
          sendJson(res, 200, { ok: true });
          return;
        }
      }
    }

    /* ── Image Search via Tavily ────────────────────────────── */
    if (req.method === 'POST' && url.pathname === '/api/image-search') {
      const user = await getSessionUser(req);
      if (!user) {
        sendJson(res, 401, { error: 'No autorizado.' });
        return;
      }

      const tavilyKey = process.env.TAVILY_API_KEY;
      if (!tavilyKey) {
        sendJson(res, 500, { error: 'TAVILY_API_KEY no está configurada en el servidor.' });
        return;
      }

      const body = await parseBody(req);
      const query = String(body.query || '').trim();
      if (!query) {
        sendJson(res, 400, { error: 'El campo "query" es obligatorio.' });
        return;
      }

      try {
        // Fetch from Tavily and DuckDuckGo in parallel
        const fetchTavilyPromise = (async () => {
          try {
            const tavilyResponse = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                api_key: tavilyKey,
                query: query,
                search_depth: 'advanced',
                include_images: true,
                include_image_descriptions: true,
                max_results: 20,
              }),
            });
            if (tavilyResponse.ok) {
              return await tavilyResponse.json();
            }
          } catch (err) {
            console.error('Error querying Tavily:', err);
          }
          return null;
        })();

        const fetchDdgPromise = (async () => {
          try {
            // 1. Fetch main page to extract the VQD token
            const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
            const pageResponse = await fetch(searchUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              }
            });

            if (!pageResponse.ok) return [];

            const html = await pageResponse.text();
            const vqdMatch = html.match(/vqd=([\'"])(.*?)\1/) || html.match(/vqd\s*=\s*[\'"]([^\'"]+)[\'"]/);
            if (!vqdMatch) return [];
            const vqd = vqdMatch[2] || vqdMatch[1];

            // 2. Fetch the JSON image results payload
            const imagesUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=-1`;
            const imagesResponse = await fetch(imagesUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://duckduckgo.com/',
              }
            });

            if (imagesResponse.ok) {
              const json = await imagesResponse.json();
              if (json && Array.isArray(json.results)) {
                return json.results.map(r => ({
                  url: r.image,
                  description: r.title || ''
                }));
              }
            }
          } catch (err) {
            console.error('Error querying DuckDuckGo:', err);
          }
          return [];
        })();

        const [tavilyData, ddgImages] = await Promise.all([fetchTavilyPromise, fetchDdgPromise]);

        // Define stop words to prevent filtering out short names (like "Xi", "Li")
        const stopWords = new Set([
          'de', 'la', 'el', 'en', 'y', 'con', 'del', 'los', 'las', 'un', 'una',
          'the', 'and', 'of', 'in', 'on', 'for', 'with', 'at', 'by', 'an', 'a', 'to'
        ]);

        const queryTerms = query
          .toLowerCase()
          .split(/\s+/)
          .filter((t) => t.length > 0 && !stopWords.has(t));

        // Keywords commonly found in design assets, logos, icons and buttons
        const junkKeywords = [
          'logo', 'icon', 'menu', 'nav', 'header', 'footer', 'sidebar',
          'button', 'avatar', 'social', 'facebook', 'twitter', 'instagram',
          'linkedin', 'youtube', 'pinterest', 'sprite', 'loading', 'placeholder',
          'widget', 'theme', 'default', 'favicon', 'banner', 'pixel', 'tracker',
          'lock', 'padlock', 'edit', 'pencil', 'signature', 'globe', 'disambig',
          'magnifying', 'symbol', 'shield', 'chevron', 'arrow', 'bullet',
          'internal-link', 'external-link', 'powered-by', 'checkmark'
        ];

        const collectedImages = [];
        const seenUrls = new Set();

        const addImage = (img, isTrustedSource) => {
          if (!img) return;
          const url = typeof img === 'string' ? img : img.url;
          const description = typeof img === 'string' ? '' : (img.description || '');
          
          if (!url || seenUrls.has(url)) return;

          // Always ignore vector graphics, gifs, and data URIs (usually layout items or icons)
          const lowerUrl = url.toLowerCase();
          if (
            lowerUrl.endsWith('.svg') ||
            lowerUrl.endsWith('.gif') ||
            lowerUrl.startsWith('data:image/')
          ) {
            return;
          }

          // Filter out layout junk
          const lowerDesc = description.toLowerCase();
          const isJunk = junkKeywords.some(
            (kw) => lowerUrl.includes(kw) || lowerDesc.includes(kw)
          );
          if (isJunk) return;

          // Curated images from Tavily and direct image search results from DuckDuckGo are trusted
          if (isTrustedSource) {
            seenUrls.add(url);
            collectedImages.push({ url, description });
            return;
          }

          // For nested webpage images, ensure either the URL or description references the person's name
          const matchesQuery = queryTerms.some(
            (term) => lowerUrl.includes(term) || lowerDesc.includes(term)
          );

          if (matchesQuery) {
            seenUrls.add(url);
            collectedImages.push({ url, description });
          }
        };

        // 1. Process DuckDuckGo dedicated image search results first
        if (Array.isArray(ddgImages)) {
          ddgImages.forEach((img) => addImage(img, true));
        }

        // 2. Process Tavily top-level curated images
        if (tavilyData && Array.isArray(tavilyData.images)) {
          tavilyData.images.forEach((img) => addImage(img, true));
        }

        // 3. Process nested webpage images (using the layout + name filter to expand results cleanly)
        if (tavilyData && Array.isArray(tavilyData.results)) {
          tavilyData.results.forEach((result) => {
            if (Array.isArray(result.images)) {
              result.images.forEach((img) => addImage(img, false));
            }
          });
        }

        sendJson(res, 200, { ok: true, query, images: collectedImages });
      } catch (fetchErr) {
        sendJson(res, 502, {
          error: 'Error al buscar imágenes en los motores de búsqueda.',
          detail: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
        });
      }
      return;
    }

    /* ── Download Images to Local Folder ────────────────────── */
    if (req.method === 'POST' && url.pathname === '/api/download-images') {
      const user = await getSessionUser(req);
      if (!user) {
        sendJson(res, 401, { error: 'No autorizado.' });
        return;
      }

      const body = await parseBody(req);
      const query = String(body.query || '').trim();
      const urls = body.urls;

      if (!query || !Array.isArray(urls) || urls.length === 0) {
        sendJson(res, 400, { error: 'Los campos "query" y "urls" (array no vacío) son obligatorios.' });
        return;
      }

      try {
        // Sanitize name for folder creation
        const safeFolderName = query.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
        const folderPath = path.join(dataDir, 'downloads', safeFolderName);
        await fs.mkdir(folderPath, { recursive: true });

        const downloadResults = [];

        for (let i = 0; i < urls.length; i++) {
          const imgUrl = urls[i];
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout per image

            const imgResponse = await fetch(imgUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!imgResponse.ok) {
              downloadResults.push({ url: imgUrl, success: false, reason: `HTTP ${imgResponse.status}` });
              continue;
            }

            const contentType = imgResponse.headers.get('content-type') || '';
            let ext = '.jpg';
            if (contentType.includes('png')) ext = '.png';
            else if (contentType.includes('webp')) ext = '.webp';
            else if (contentType.includes('gif')) ext = '.gif';

            const buffer = Buffer.from(await imgResponse.arrayBuffer());
            const fileName = `foto-${i + 1}${ext}`;
            const filePath = path.join(folderPath, fileName);
            await fs.writeFile(filePath, buffer);

            downloadResults.push({ url: imgUrl, success: true, file: fileName });
          } catch (downloadErr) {
            downloadResults.push({
              url: imgUrl,
              success: false,
              reason: downloadErr instanceof Error ? downloadErr.message : String(downloadErr)
            });
          }
        }

        // Open directory on Windows Explorer
        if (process.platform === 'win32') {
          const winPath = folderPath.replace(/\//g, '\\');
          exec(`start "" "${winPath}"`, (execErr) => {
            if (execErr) {
              console.warn('Fallback to explorer.exe:', execErr.message);
              exec(`explorer.exe "${winPath}"`);
            }
          });
        }

        const successfulCount = downloadResults.filter(r => r.success).length;

        sendJson(res, 200, {
          ok: true,
          query,
          folderPath,
          successfulCount,
          totalCount: urls.length,
          results: downloadResults
        });
      } catch (err) {
        sendJson(res, 500, {
          error: 'Error al descargar las imágenes en el servidor.',
          detail: err instanceof Error ? err.message : String(err)
        });
      }
      return;
    }

    sendJson(res, 404, { error: 'Ruta no encontrada.' });
  } catch (error) {
    console.error('Error procesando petición:', error);
    sendJson(res, 500, {
      error: 'Error interno del servidor.',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`KLE API listening on port ${PORT}`);
});
