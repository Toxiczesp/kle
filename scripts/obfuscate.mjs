import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const assetsDir = path.join(projectRoot, 'dist', 'assets');

const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,
  rotateStringArray: true,
  selfDefending: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};

async function obfuscateBuildAssets() {
  const files = await readdir(assetsDir);
  const jsFiles = files.filter((file) => file.endsWith('.js'));

  if (jsFiles.length === 0) {
    console.warn('No se encontraron bundles JS en dist/assets para ofuscar.');
    return;
  }

  for (const file of jsFiles) {
    const filePath = path.join(assetsDir, file);
    const source = await readFile(filePath, 'utf8');
    const obfuscated = JavaScriptObfuscator.obfuscate(source, obfuscationOptions).getObfuscatedCode();
    await writeFile(filePath, obfuscated, 'utf8');
    console.log(`Ofuscado: ${path.relative(projectRoot, filePath)}`);
  }
}

obfuscateBuildAssets().catch((error) => {
  console.error('Fallo al ofuscar la build:', error);
  process.exitCode = 1;
});
