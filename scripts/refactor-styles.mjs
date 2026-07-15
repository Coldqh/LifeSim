import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const ENTRY_FILE = resolve(ROOT, 'src/styles.css');
const STYLE_DIR = resolve(ROOT, 'src/styles');
const PARTS_DIR = join(STYLE_DIR, 'parts');
const INDEX_FILE = join(STYLE_DIR, 'index.css');
const MANIFEST_FILE = join(STYLE_DIR, 'manifest.json');
const README_FILE = join(STYLE_DIR, 'README.md');
const GENERATED_MARKER = 'LifeSim generated style entrypoint';
const TARGET_LINES = 420;
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
    .slice(0, 52);

  return transliterated || 'styles';
}

function extractHeading(chunk) {
  const banner = chunk.match(/\/\*\s*=+\s*\r?\n\s*([^*\r\n][^\r\n]*)/);
  if (banner?.[1]) return banner[1].trim();

  const comment = chunk.match(/\/\*\s*([^*\r\n][^\r\n]{2,80})\s*\*\//);
  if (comment?.[1]) return comment[1].trim();

  const sample = chunk.slice(0, 3000);
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

function stripComments(value) {
  return value.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Finds offsets where a complete top-level CSS statement ends.
 * A rule may be split only after a top-level `}` or `;`.
 * Merely having brace depth 0 is not enough: selector preludes also live at
 * depth 0, which was the bug that produced files ending with `.selector,`.
 */
function findRuleBoundaries(css, label = 'CSS') {
  const boundaries = [];
  let depth = 0;
  let inComment = false;
  let quote;
  let escaped = false;

  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];

    if (inComment) {
      if (char === '*' && next === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }

    if (char === '/' && next === '*') {
      inComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth < 0) throw new Error(`${label}: лишняя закрывающая фигурная скобка.`);
      if (depth === 0) boundaries.push(index + 1);
      continue;
    }

    if (char === ';' && depth === 0) boundaries.push(index + 1);
  }

  if (depth !== 0) throw new Error(`${label}: незакрытый CSS-блок.`);
  if (inComment) throw new Error(`${label}: незакрытый комментарий.`);
  if (quote) throw new Error(`${label}: незакрытая строка.`);

  const lastBoundary = boundaries.at(-1) ?? 0;
  const trailing = stripComments(css.slice(lastBoundary)).trim();
  if (trailing.length > 0) {
    const preview = trailing.replace(/\s+/g, ' ').slice(0, 90);
    throw new Error(`${label}: файл заканчивается внутри селектора или at-rule: ${preview}`);
  }

  if (lastBoundary < css.length) boundaries.push(css.length);
  return [...new Set(boundaries)];
}

function splitCss(css, label = 'CSS') {
  const boundaries = findRuleBoundaries(css, label);
  const chunks = [];
  let start = 0;
  let startLine = 1;

  for (const boundary of boundaries) {
    const candidate = css.slice(start, boundary);
    const candidateLines = countLines(candidate);
    const isLastBoundary = boundary === boundaries.at(-1);

    if (candidateLines < TARGET_LINES && !isLastBoundary) continue;

    const trailingEnd = isLastBoundary ? css.length : boundary;
    const content = css.slice(start, trailingEnd);
    if (content.trim().length > 0) {
      const lines = countLines(content);
      chunks.push({
        content,
        startLine,
        endLine: startLine + lines - 1
      });
      startLine += lines - 1;
    }
    start = trailingEnd;
  }

  if (start < css.length) {
    const content = css.slice(start);
    if (content.trim().length > 0) {
      const lines = countLines(content);
      chunks.push({ content, startLine, endLine: startLine + lines - 1 });
    }
  }

  if (chunks.length === 0) throw new Error(`${label}: не удалось выделить CSS-части.`);
  if (chunks.map((chunk) => chunk.content).join('') !== css) {
    throw new Error(`${label}: побайтовая реконструкция после разреза не совпала с исходником.`);
  }

  for (const [index, chunk] of chunks.entries()) {
    findRuleBoundaries(chunk.content, `${label}, часть ${index}`);
  }

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

function parseIndexImports() {
  if (!existsSync(INDEX_FILE)) throw new Error('Не найден src/styles/index.css.');
  const index = readFileSync(INDEX_FILE, 'utf8');
  const files = [...index.matchAll(/@import\s+['"]\.\/([^'"]+)['"]\s*;/g)].map((match) => match[1]);
  if (files.length === 0) throw new Error('В src/styles/index.css нет импортов частей.');
  return files;
}

function makeGeneratedFiles(chunks, { rewriteReferences = false } = {}) {
  const usedNames = new Map();
  return chunks.map((chunk, index) => {
    const heading = extractHeading(chunk.content);
    const slug = slugify(heading);
    const seen = usedNames.get(slug) ?? 0;
    usedNames.set(slug, seen + 1);
    const suffix = seen === 0 ? '' : `-${seen + 1}`;
    const fileName = `${String(index).padStart(2, '0')}-${slug}${suffix}.css`;
    const content = rewriteReferences ? rewriteRelativeReferences(chunk.content) : chunk.content;
    return {
      order: index,
      file: `parts/${fileName}`,
      heading,
      originalStartLine: chunk.startLine,
      originalEndLine: chunk.endLine,
      lines: countLines(content),
      content
    };
  });
}

function writeGeneratedStructure(files, source, mode) {
  mkdirSync(STYLE_DIR, { recursive: true });
  const tempParts = join(STYLE_DIR, `.parts-rebuild-${process.pid}-${Date.now()}`);
  mkdirSync(tempParts, { recursive: true });

  try {
    for (const item of files) {
      findRuleBoundaries(item.content, item.file);
      writeFileSync(join(tempParts, basename(item.file)), item.content, 'utf8');
    }

    if (existsSync(PARTS_DIR)) rmSync(PARTS_DIR, { recursive: true, force: true });
    renameSync(tempParts, PARTS_DIR);
  } catch (error) {
    rmSync(tempParts, { recursive: true, force: true });
    throw error;
  }

  const imports = files.map(({ file }) => `@import './${file}';`).join('\n');
  writeFileSync(INDEX_FILE, `/* ${GENERATED_MARKER}. Keep imports in this order. */\n${imports}\n`, 'utf8');
  writeFileSync(ENTRY_FILE, `/* ${GENERATED_MARKER}. */\n@import './styles/index.css';\n`, 'utf8');

  const manifest = {
    version: 2,
    mode,
    sourceFile: 'src/styles.css',
    sourceSha256: sha256(source),
    sourceLines: countLines(source),
    targetLinesPerPart: TARGET_LINES,
    maxRecommendedLines: MAX_RECOMMENDED_LINES,
    files: files.map(({ content: _content, ...item }) => item)
  };
  writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  if (!existsSync(README_FILE)) {
    writeFileSync(
      README_FILE,
      '# LifeSim styles\n\n' +
      'CSS хранится в последовательных автономных частях. Порядок импортов в `index.css` является частью каскада.\n\n' +
      '- `npm run styles:repair` безопасно пересобирает части только по завершённым CSS-правилам.\n' +
      '- `npm run styles:verify` проверяет каждую часть отдельно и весь объединённый каскад.\n',
      'utf8'
    );
  }
}

function split() {
  if (!existsSync(ENTRY_FILE)) fail('Не найден src/styles.css. Запускай команду из корня LifeSim.');
  const source = readFileSync(ENTRY_FILE, 'utf8');
  if (source.includes(GENERATED_MARKER)) fail('styles.css уже разделён. Используй repair или verify.');
  if (source.trim().length < 500) fail('styles.css слишком мал: похоже, это уже entrypoint.');
  if (existsSync(PARTS_DIR) && readdirSync(PARTS_DIR).length > 0) fail('src/styles/parts уже содержит файлы.');

  try {
    const chunks = splitCss(source, 'src/styles.css');
    const files = makeGeneratedFiles(chunks, { rewriteReferences: true });
    writeGeneratedStructure(files, source, 'split');
    console.log(`[styles] Разрез завершён: ${countLines(source)} строк → ${files.length} автономных CSS-файлов.`);
    verify();
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

function repair() {
  try {
    const importedFiles = parseIndexImports();

    // After the one-time repair, ordinary builds must not rewrite valid source
    // files. This also lets developers edit an individual autonomous part.
    try {
      for (const file of importedFiles) {
        const path = join(STYLE_DIR, file);
        if (!existsSync(path)) throw new Error(`Не найден CSS-файл ${relative(ROOT, path)}.`);
        findRuleBoundaries(readFileSync(path, 'utf8'), file);
      }
      console.log(`[styles] REPAIR SKIP: ${importedFiles.length} частей уже автономны.`);
      verify();
      return;
    } catch {
      // At least one old part ends inside a selector/at-rule. Rejoin everything
      // in cascade order and perform one safe rebuild below.
    }

    const source = importedFiles.map((file) => {
      const path = join(STYLE_DIR, file);
      if (!existsSync(path)) throw new Error(`Не найден CSS-файл ${relative(ROOT, path)}.`);
      return readFileSync(path, 'utf8');
    }).join('');

    // The old splitter preserved bytes but could cut selector lists. Joining the
    // ordered parts restores the original valid cascade before safe re-splitting.
    const chunks = splitCss(source, 'объединённый CSS');
    const files = makeGeneratedFiles(chunks);
    writeGeneratedStructure(files, source, 'repair');
    console.log(`[styles] REPAIR PASS: ${importedFiles.length} старых частей → ${files.length} автономных частей.`);
    verify();
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

function verify() {
  try {
    if (!existsSync(ENTRY_FILE) || !existsSync(INDEX_FILE) || !existsSync(MANIFEST_FILE)) {
      throw new Error('Разделённая структура не найдена.');
    }

    const entry = readFileSync(ENTRY_FILE, 'utf8');
    if (!entry.includes(GENERATED_MARKER) || !entry.includes("@import './styles/index.css';")) {
      throw new Error('src/styles.css больше не является корректной точкой входа.');
    }

    const manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
    const importedFiles = parseIndexImports();
    const expectedFiles = manifest.files.map(({ file }) => file);
    if (JSON.stringify(importedFiles) !== JSON.stringify(expectedFiles)) {
      throw new Error('Порядок импортов в index.css не совпадает с manifest.json.');
    }

    let oversized = 0;
    const combined = [];
    for (const item of manifest.files) {
      const path = join(STYLE_DIR, item.file);
      if (!existsSync(path)) throw new Error(`Не найден CSS-файл ${relative(ROOT, path)}.`);
      const content = readFileSync(path, 'utf8');
      findRuleBoundaries(content, item.file);
      combined.push(content);
      if (countLines(content) > MAX_RECOMMENDED_LINES) oversized += 1;
    }

    findRuleBoundaries(combined.join(''), 'объединённый CSS');

    const registered = new Set(manifest.files.map((item) => basename(item.file)));
    const unexpected = readdirSync(PARTS_DIR)
      .filter((name) => name.endsWith('.css'))
      .filter((name) => !registered.has(name));
    if (unexpected.length > 0) throw new Error(`Незарегистрированные CSS-файлы: ${unexpected.join(', ')}.`);

    console.log(`[styles] VERIFY PASS: ${manifest.files.length} автономных файлов, каскад сохранён.`);
    if (oversized > 0) console.warn(`[styles] ${oversized} крупных правил нельзя безопасно разрезать автоматически.`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

const command = process.argv[2] ?? 'split';
if (command === 'split') split();
else if (command === 'repair') repair();
else if (command === 'verify') verify();
else fail(`Неизвестная команда: ${command}. Используй split, repair или verify.`);
