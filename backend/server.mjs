import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { defaultAuthorityData, defaultUsers } from './seed-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const dataDir = process.env.HOME
  ? path.join(process.env.HOME, 'kle-data')
  : path.join(rootDir, 'server-data');

const usersFile = path.join(dataDir, 'users.json');
const sessionsFile = path.join(dataDir, 'sessions.json');
const authorityDataFile = path.join(dataDir, 'authority-data.json');

const PORT = Number(
  process.env.PORT ||
  process.env.KLE_API_PORT ||
  3001
);

async function ensureFile(filePath, initialValue) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(
      filePath,
      JSON.stringify(initialValue, null, 2),
      'utf8'
    );
  }
}

async function bootstrap() {
  await ensureFile(usersFile, defaultUsers);
  await ensureFile(sessionsFile, []);
  await ensureFile(authorityDataFile, defaultAuthorityData);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function writeJson(filePath, value) {
  await fs.writeFile(
    filePath,
    JSON.stringify(value, null, 2),
    'utf8'
  );
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  });

  if (statusCode === 204) {
    res.end();
    return;
  }

  res.end(JSON.stringify(payload));
}

function hashPassword(password) {
  return createHash('sha256')
    .update(password)
    .digest('hex');
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

  return JSON.parse(
    Buffer.concat(chunks).toString('utf8')
  );
}

async function getSessionUser(req) {
  const authHeader = req.headers.authorization || '';

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : '';

  if (!token) {
    return null;
  }

  const sessions = await readJson(sessionsFile);
  const session = sessions.find(
    (item) => item.token === token
  );

  if (!session) {
    return null;
  }

  const users = await readJson(usersFile);
  const user = users.find(
    (item) => item.email === session.email
  );

  return user ? sanitizeUser(user) : null;
}

const authoritySections = new Set([
  'requests',
  'evaluations',
  'publishedProfiles',
  'sharedDocuments',
  'dossierEvaluations',
  'observationQuestionnaires',
]);

await bootstrap();

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 404, {
      error: 'Ruta no válida.',
    });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(
    req.url,
    `http://${req.headers.host || 'localhost'}`
  );

  try {
    // Ruta principal de comprobación
    if (
      req.method === 'GET' &&
      url.pathname === '/'
    ) {
      sendJson(res, 200, {
        status: 'ok',
        service: 'KLE API',
      });
      return;
    }

    // Ruta de salud del backend
    if (
      req.method === 'GET' &&
      url.pathname === '/api/health'
    ) {
      sendJson(res, 200, {
        status: 'ok',
        service: 'KLE API',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (
      req.method === 'POST' &&
      url.pathname === '/api/auth/login'
    ) {
      const body = await parseBody(req);

      const email = String(body.email || '')
        .trim()
        .toLowerCase();

      const password = String(body.password || '');

      const users = await readJson(usersFile);

      const found = users.find(
        (item) =>
          item.email.toLowerCase() === email &&
          item.passwordHash === hashPassword(password)
      );

      if (!found) {
        sendJson(res, 401, {
          error: 'Credenciales no válidas.',
        });
        return;
      }

      const sessions = await readJson(sessionsFile);
      const token = randomUUID();

      const nextSessions = [
        ...sessions.filter(
          (item) => item.email !== found.email
        ),
        {
          token,
          email: found.email,
          createdAt: new Date().toISOString(),
        },
      ];

      await writeJson(
        sessionsFile,
        nextSessions
      );

      sendJson(res, 200, {
        token,
        user: sanitizeUser(found),
      });

      return;
    }

    if (
      req.method === 'POST' &&
      url.pathname === '/api/auth/register'
    ) {
      const body = await parseBody(req);

      const name = String(body.name || '').trim();

      const email = String(body.email || '')
        .trim()
        .toLowerCase();

      const password = String(body.password || '');

      const role =
        body.role === 'autoridad'
          ? 'autoridad'
          : 'analista';

      if (
        !name ||
        !email ||
        password.length < 6
      ) {
        sendJson(res, 400, {
          error: 'Datos de registro no válidos.',
        });
        return;
      }

      const users = await readJson(usersFile);

      if (
        users.some(
          (item) =>
            item.email.toLowerCase() === email
        )
      ) {
        sendJson(res, 409, {
          error: 'Ya existe un usuario con ese correo.',
        });
        return;
      }

      const newUser = {
        id: `usr-${Date.now()}`,
        name,
        email,
        passwordHash: hashPassword(password),
        role,
      };

      await writeJson(
        usersFile,
        [...users, newUser]
      );

      const sessions = await readJson(sessionsFile);
      const token = randomUUID();

      await writeJson(
        sessionsFile,
        [
          ...sessions.filter(
            (item) => item.email !== email
          ),
          {
            token,
            email,
            createdAt: new Date().toISOString(),
          },
        ]
      );

      sendJson(res, 201, {
        token,
        user: sanitizeUser(newUser),
      });

      return;
    }

    if (
      req.method === 'GET' &&
      url.pathname === '/api/auth/session'
    ) {
      const user = await getSessionUser(req);

      if (!user) {
        sendJson(res, 401, {
          error: 'Sesión no válida.',
        });
        return;
      }

      sendJson(res, 200, {
        user,
      });

      return;
    }

    if (
      req.method === 'POST' &&
      url.pathname === '/api/auth/logout'
    ) {
      const authHeader =
        req.headers.authorization || '';

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : '';

      const sessions = await readJson(sessionsFile);

      await writeJson(
        sessionsFile,
        sessions.filter(
          (item) => item.token !== token
        )
      );

      sendJson(res, 200, {
        ok: true,
      });

      return;
    }

    if (
      req.method === 'GET' &&
      url.pathname === '/api/authority-data'
    ) {
      const user = await getSessionUser(req);

      if (!user) {
        sendJson(res, 401, {
          error: 'No autorizado.',
        });
        return;
      }

      const data = await readJson(
        authorityDataFile
      );

      sendJson(res, 200, data);
      return;
    }

    if (
      req.method === 'PUT' &&
      url.pathname.startsWith(
        '/api/authority-data/'
      )
    ) {
      const user = await getSessionUser(req);

      if (!user) {
        sendJson(res, 401, {
          error: 'No autorizado.',
        });
        return;
      }

      const section = url.pathname.replace(
        '/api/authority-data/',
        ''
      );

      if (!authoritySections.has(section)) {
        sendJson(res, 404, {
          error: 'Sección no encontrada.',
        });
        return;
      }

      const body = await parseBody(req);

      if (!Array.isArray(body.items)) {
        sendJson(res, 400, {
          error: 'Carga no válida.',
        });
        return;
      }

      const data = await readJson(
        authorityDataFile
      );

      data[section] = body.items;

      await writeJson(
        authorityDataFile,
        data
      );

      sendJson(res, 200, {
        ok: true,
        items: data[section],
      });

      return;
    }

    sendJson(res, 404, {
      error: 'Ruta no encontrada.',
    });
  } catch (error) {
    console.error('Error procesando petición:', error);

    sendJson(res, 500, {
      error: 'Error interno del servidor.',
      detail:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `KLE API listening on port ${PORT}`
  );
});