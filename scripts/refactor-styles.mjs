import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const ENTRY_FILE = resolve(ROOT, 'src/styles.css');
const STYLE_DIR = resolve(ROOT, 'src/styles');
const PARTS_DIR = join(STYLE_DIR, 'parts');
const INDEX_FILE = join(STYLE_DIR, 'index.css');
const MANIFEST_FILE = join(STYLE_DIR, 'manifest.json');
const README_FILE = join(STYLE_DIR, 'README.md');
const GENERATED_MARKER = 'LifeSim generated style entrypoint';
const TARGET_LINES = 420;
const MIN_SECTION_LINES = 80;
const MAX_RECOMMENDED_LINES = 1200;

function fail(message) {
  console.error(`\n[styles] ERROR: ${message}\n`);
  process.exit(1);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function countLines(value) {
  if (value.length === 0) return 0;
  return value.split(/\r?\n/).length;
}

function slugify(value) {
  const transliterated = value
    .toLowerCase()
    .replace(/[а-яё]/g, (letter) => ({
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
      к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
      х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
    }[letter] ?? letter))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return transliterated || 'section';
}

function extractHeading(chunk) {
  const banner = chunk.match(/\/\*\s*=+\s*\r?\n\s*([^*\r\n][^\r\n]*)/);
  if (banner?.[1]) return banner[1].trim();

  const comment = chunk.match(/\/\*\s*([^*\r\n][^\r\n]{2,80})\s*\*\//);
  if (comment?.[1]) return comment[1].trim();

  const sample = chunk.slice(0, 2500);
  const categories = [
    ['mobile-navigation', 'mobile-navigation'],
    ['desktop-navigation', 'desktop-navigation'],
    ['top-status-bar', 'status-bar'],
    ['app-frame', 'app-shell'],
    ['business-', 'business'],
    ['housing-', 'housing'],
    ['boxing-', 'boxing'],
    ['sport-', 'sport'],
    ['job-', 'jobs'],
    ['work-', 'work'],
    ['city-', 'city'],
    ['district-', 'districts'],
    ['profile-', 'profile'],
    ['character-', 'character'],
    ['people-', 'people'],
    ['social-', 'social'],
    ['inventory-', 'inventory'],
    ['action-', 'actions'],
    ['@media', 'responsive'],
    [':root', 'tokens-base']
  ];

  return categories.find(([needle]) => sample.includes(needle))?.[1] ?? 'styles';
}

function scanLine(line, state) {
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (state.inComment) {
      if (char === '*' && next === '/') {
        state.inComment = false;
        index += 1;
      }
      continue;
    }

    if (state.quote) {
      if (state.escaped) {
        state.escaped = false;
      } else if (char === '\\') {
        state.escaped = true;
      } else if (char === state.quote) {
        state.quote = undefined;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      state.inComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      state.quote = char;
      continue;
    }

    if (char === '{') state.depth += 1;
    if (char === '}') state.depth -= 1;
    if (state.depth < 0) fail('Обнаружена лишняя закрывающая фигурная скобка. Исходный CSS повреждён.');
  }
}

function isBannerLine(line) {
  return /^\s*\/\*\s*= {0,1}=+/.test(line) || /^\s*\/\* ={3,}/.test(line);
}

function splitCss(css) {
  const lines = css.match(/.*(?:\r\n|\n|$)/g)?.filter(Boolean) ?? [];
  const chunks = [];
  let current = [];
  let currentStartLine = 1;
  const state = { depth: 0, inComment: false, quote: undefined, escaped: false };

  const flush = (endLine) => {
    const content = current.join('');
    if (content.trim().length === 0) {
      current = [];
      currentStartLine = endLine + 1;
      return;
    }
    chunks.push({ content, startLine: currentStartLine, endLine });
    current = [];
    currentStartLine = endLine + 1;
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const atTopLevel = state.depth === 0 && !state.inComment && !state.quote;

    if (atTopLevel && isBannerLine(line) && current.length >= MIN_SECTION_LINES) {
      flush(lineNumber - 1);
      currentStartLine = lineNumber;
    }

    current.push(line);
    scanLine(line, state);

    const safeBoundary = state.depth === 0 && !state.inComment && !state.quote;
    if (safeBoundary && current.length >= TARGET_LINES) flush(lineNumber);
  });

  if (state.depth !== 0 || state.inComment || state.quote) {
    fail('Исходный CSS заканчивается внутри незакрытого блока, комментария или строки. Разрез остановлен.');
  }

  if (current.length > 0) flush(lines.length);
  return chunks;
}

function rewriteRelativeReferences(css) {
  const rewriteUrl = (raw, quote, target) => {
    const value = target.trim();
    if (/^(?:data:|https?:|blob:|\/\/|\/|#|var\()/i.test(value)) return raw;
    const normalized = value.replace(/^\.\//, '');
    return `url(${quote ?? ''}../../${normalized}${quote ?? ''})`;
  };

  let result = css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, rewriteUrl);

  result = result.replace(
    /@import\s+(["'])(?!data:|https?:|\/\/|\/|#)([^"']+)\1/gi,
    (_raw, quote, target) => `@import ${quote}../../${target.replace(/^\.\//, '')}${quote}`
  );

  return result;
}

function ensureCleanStyleDirectory() {
  mkdirSync(STYLE_DIR, { recursive: true });

  if (existsSync(PARTS_DIR)) {
    const existingParts = readdirSync(PARTS_DIR);
    if (existingParts.length > 0) {
      fail(`Папка src/styles/parts уже содержит файлы: ${existingParts.join(', ')}. Разрез остановлен, чтобы ничего не перезаписать.`);
    }
  } else {
    mkdirSync(PARTS_DIR, { recursive: true });
  }

  for (const managedFile of [INDEX_FILE, MANIFEST_FILE, README_FILE]) {
    if (existsSync(managedFile)) {
      fail(`Файл ${relative(ROOT, managedFile)} уже существует. Разбери конфликт вручную.`);
    }
  }
}

function registerPackageScripts() {
  const packagePath = resolve(ROOT, 'package.json');
  if (!existsSync(packagePath)) return;

  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  packageJson.scripts ??= {};
  packageJson.scripts['styles:verify'] ??= 'node scripts/refactor-styles.mjs verify';
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
}

function createReadme(files) {
  return `# LifeSim styles\n\n` +
    `Глобальный CSS разделён на ${files.length} последовательных частей.\n\n` +
    `## Правила\n\n` +
    `- \`src/styles.css\` — только стабильная точка входа.\n` +
    `- \`src/styles/index.css\` определяет порядок каскада. Не переставляй импорты без визуального регрессионного теста.\n` +
    `- Редактируй конкретный файл раздела напрямую. Повторно запускать split после обычных правок не нужно.\n` +
    `- Новые крупные системы получают отдельный CSS-файл и импорт в нужной позиции.\n` +
    `- Responsive-переопределения должны находиться после базовых правил, которые они меняют.\n` +
    `- Относительные URL были автоматически скорректированы после переноса из \`src/\` в \`src/styles/parts/\`.\n\n` +
    `## Проверка\n\n` +
    `\`node scripts/refactor-styles.mjs verify\`\n`;
}

function split() {
  if (!existsSync(ENTRY_FILE)) fail('Не найден src/styles.css. Запускай команду из корня LifeSim.');

  const source = readFileSync(ENTRY_FILE, 'utf8');
  if (source.includes(GENERATED_MARKER)) {
    fail('styles.css уже разделён. Используй команду verify, а не split.');
  }

  if (source.trim().length < 500) fail('styles.css слишком мал: похоже, это уже entrypoint или неверный файл.');

  const chunks = splitCss(source);
  if (chunks.length < 4) fail(`Получилось только ${chunks.length} части. Автоматический разрез отменён.`);

  ensureCleanStyleDirectory();

  const usedNames = new Map();
  const manifestFiles = chunks.map((chunk, index) => {
    const heading = extractHeading(chunk.content);
    const slug = slugify(heading);
    const seen = usedNames.get(slug) ?? 0;
    usedNames.set(slug, seen + 1);
    const suffix = seen === 0 ? '' : `-${seen + 1}`;
    const fileName = `${String(index).padStart(2, '0')}-${slug}${suffix}.css`;
    const generatedContent = rewriteRelativeReferences(chunk.content);
    writeFileSync(join(PARTS_DIR, fileName), generatedContent, 'utf8');

    return {
      order: index,
      file: `parts/${fileName}`,
      heading,
      originalStartLine: chunk.startLine,
      originalEndLine: chunk.endLine,
      lines: countLines(generatedContent)
    };
  });

  const imports = manifestFiles.map(({ file }) => `@import './${file}';`).join('\n');
  writeFileSync(
    INDEX_FILE,
    `/* ${GENERATED_MARKER}. Keep imports in this order. */\n${imports}\n`,
    'utf8'
  );
  writeFileSync(
    ENTRY_FILE,
    `/* ${GENERATED_MARKER}. */\n@import './styles/index.css';\n`,
    'utf8'
  );

  const manifest = {
    version: 1,
    sourceFile: 'src/styles.css',
    originalSha256: sha256(source),
    originalLines: countLines(source),
    targetLinesPerPart: TARGET_LINES,
    maxRecommendedLines: MAX_RECOMMENDED_LINES,
    files: manifestFiles
  };

  writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  writeFileSync(README_FILE, createReadme(manifestFiles), 'utf8');
  registerPackageScripts();

  const reconstructed = manifestFiles.map(({ file }) => readFileSync(join(STYLE_DIR, file), 'utf8')).join('');
  const expected = chunks.map((chunk) => rewriteRelativeReferences(chunk.content)).join('');
  if (reconstructed !== expected) fail('Побайтовая проверка порядка CSS не прошла. Изменения остановлены.');

  console.log(`[styles] Разрез завершён: ${manifest.originalLines} строк → ${manifestFiles.length} CSS-файлов.`);
  console.log(`[styles] Самый крупный файл: ${Math.max(...manifestFiles.map((file) => file.lines))} строк.`);
  verify();
}

function verifyBalancedCss(css, label) {
  const state = { depth: 0, inComment: false, quote: undefined, escaped: false };
  for (const line of css.match(/.*(?:\r\n|\n|$)/g)?.filter(Boolean) ?? []) scanLine(line, state);
  if (state.depth !== 0 || state.inComment || state.quote) fail(`${label}: незакрытый CSS-блок, комментарий или строка.`);
}

function verify() {
  if (!existsSync(ENTRY_FILE) || !existsSync(INDEX_FILE) || !existsSync(MANIFEST_FILE)) {
    fail('Разделённая структура не найдена. Сначала запусти split.');
  }

  const entry = readFileSync(ENTRY_FILE, 'utf8');
  if (!entry.includes(GENERATED_MARKER) || !entry.includes("@import './styles/index.css';")) {
    fail('src/styles.css больше не является корректной точкой входа.');
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
  const index = readFileSync(INDEX_FILE, 'utf8');
  const expectedImports = manifest.files.map(({ file }) => `@import './${file}';`);
  const actualImports = [...index.matchAll(/@import\s+['"]\.\/([^'"]+)['"]\s*;/g)]
    .map((match) => `@import './${match[1]}';`);

  if (JSON.stringify(expectedImports) !== JSON.stringify(actualImports)) {
    fail('Порядок импортов в src/styles/index.css не совпадает с manifest.json.');
  }

  let oversized = 0;
  for (const item of manifest.files) {
    const path = join(STYLE_DIR, item.file);
    if (!existsSync(path)) fail(`Не найден CSS-файл ${relative(ROOT, path)}.`);
    const content = readFileSync(path, 'utf8');
    verifyBalancedCss(content, item.file);
    const lines = countLines(content);
    if (lines > MAX_RECOMMENDED_LINES) oversized += 1;
  }

  const registeredPartNames = new Set(manifest.files.map((item) => basename(item.file)));
  const unexpectedCss = readdirSync(PARTS_DIR)
    .filter((name) => name.endsWith('.css'))
    .filter((name) => !registeredPartNames.has(name));
  if (unexpectedCss.length > 0) fail(`CSS-файлы не зарегистрированы в manifest: ${unexpectedCss.join(', ')}.`);

  console.log(`[styles] VERIFY PASS: ${manifest.files.length} файлов, порядок каскада сохранён.`);
  if (oversized > 0) console.warn(`[styles] Внимание: ${oversized} крупных top-level блока нельзя безопасно разрезать без отдельного рефакторинга.`);
}

const command = process.argv[2] ?? 'split';
if (command === 'split') split();
else if (command === 'verify') verify();
else fail(`Неизвестная команда: ${command}. Используй split или verify.`);
