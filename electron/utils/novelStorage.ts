import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { getArchiveDrive } from './archiveConfig';
import { isSafePath } from './pathValidator';
import { logger } from './logger';
import {
  countTopLevelArrayObjects,
  extractJsonNullableStringField,
  extractJsonStringField,
  LIST_SCAN_CONCURRENCY,
  mapWithConcurrency,
} from './listScanUtils';
import { formatFontFamilyCss } from './systemFonts';

const DEFAULT_BOOK_SIZE_ID = 'us-trade';
const DEFAULT_MARGIN_MM = 19;

export const NOVEL_JSON_FILENAME = 'novel.vault-novel.json';
export const NOVEL_ASSETS_DIR = 'assets';

export async function getNovelLibraryPath(): Promise<string> {
  const archiveDrive = await getArchiveDrive();
  if (!archiveDrive) {
    throw new Error('Vault directory not set');
  }
  const novelLibraryPath = path.join(archiveDrive, 'NovelLibrary');
  await fs.mkdir(novelLibraryPath, { recursive: true });
  return novelLibraryPath;
}

export function getCaseNovelsPath(casePath: string): string {
  return path.join(casePath, '.novels');
}

export function getNovelFolderPath(basePath: string, novelId: string): string {
  return path.join(basePath, novelId);
}

export function getNovelJsonPath(novelFolderPath: string): string {
  return path.join(novelFolderPath, NOVEL_JSON_FILENAME);
}

export function getNovelAssetsPath(novelFolderPath: string): string {
  return path.join(novelFolderPath, NOVEL_ASSETS_DIR);
}

export interface NovelPageImageStored {
  id: string;
  assetPath: string;
  x: number;
  y: number;
  width: number;
  height: number;
  wrapMode: 'inline' | 'square' | 'behind';
}

export interface NovelPageStored {
  id: string;
  side: 'left' | 'right';
  type: 'cover' | 'content';
  contentHtml: string;
  images: NovelPageImageStored[];
}

export interface NovelDocumentStored {
  id: string;
  title: string;
  version: 1;
  createdAt: number;
  updatedAt: number;
  casePath: string | null;
  novelFolderPath: string;
  settings: {
    showPageNumbers: boolean;
    fontFamily: string;
    fontSize: number;
    bookSizeId: string;
    marginMm: number;
    coverTitle: string;
    coverSubtitle?: string;
    coverAuthor?: string;
    showCoverEditionBadge?: boolean;
    coverImageAssetId?: string;
    coverImageRelativePath?: string;
  };
  pages: NovelPageStored[];
}

export interface NovelListEntryStored {
  id: string;
  title: string;
  novelFolderPath: string;
  casePath: string | null;
  caseName?: string;
  modified: number;
  pageCount: number;
}

function createDefaultPages(_title: string): NovelPageStored[] {
  const coverId = randomUUID();
  const pages: NovelPageStored[] = [
    {
      id: coverId,
      side: 'left',
      type: 'cover',
      contentHtml: '',
      images: [],
    },
  ];

  for (let i = 0; i < 4; i++) {
    pages.push({
      id: randomUUID(),
      side: i % 2 === 0 ? 'left' : 'right',
      type: 'content',
      contentHtml: '',
      images: [],
    });
  }

  return pages;
}

export function createEmptyNovelDocument(
  title: string,
  novelFolderPath: string,
  casePath: string | null,
  bookSizeId: string = DEFAULT_BOOK_SIZE_ID
): NovelDocumentStored {
  const now = Date.now();
  return {
    id: path.basename(novelFolderPath),
    title,
    version: 1,
    createdAt: now,
    updatedAt: now,
    casePath,
    novelFolderPath,
    settings: {
      showPageNumbers: true,
      fontFamily: 'Georgia, serif',
      fontSize: 12,
      bookSizeId: bookSizeId || DEFAULT_BOOK_SIZE_ID,
      marginMm: DEFAULT_MARGIN_MM,
      coverTitle: title,
      coverSubtitle: '',
      coverAuthor: '',
      showCoverEditionBadge: true,
    },
    pages: createDefaultPages(title),
  };
}

function normalizeStoredSettings(
  settings: NovelDocumentStored['settings']
): NovelDocumentStored['settings'] {
  return {
    ...settings,
    bookSizeId: settings.bookSizeId || DEFAULT_BOOK_SIZE_ID,
    marginMm: typeof settings.marginMm === 'number' ? settings.marginMm : DEFAULT_MARGIN_MM,
  };
}

export async function readNovelDocument(novelFolderPath: string): Promise<NovelDocumentStored> {
  if (!isSafePath(novelFolderPath)) {
    throw new Error('Invalid novel folder path');
  }
  const jsonPath = getNovelJsonPath(novelFolderPath);
  const raw = await fs.readFile(jsonPath, 'utf8');
  const doc = JSON.parse(raw) as NovelDocumentStored;
  doc.novelFolderPath = novelFolderPath;
  doc.settings = normalizeStoredSettings(doc.settings);
  if (!Array.isArray(doc.pages)) {
    doc.pages = createDefaultPages(doc.title);
  }
  return doc;
}

export async function writeNovelDocument(doc: NovelDocumentStored): Promise<void> {
  if (!isSafePath(doc.novelFolderPath)) {
    throw new Error('Invalid novel folder path');
  }
  doc.updatedAt = Date.now();
  const jsonPath = getNovelJsonPath(doc.novelFolderPath);
  await fs.mkdir(doc.novelFolderPath, { recursive: true });
  await fs.mkdir(getNovelAssetsPath(doc.novelFolderPath), { recursive: true });
  await fs.writeFile(jsonPath, JSON.stringify(doc, null, 2), 'utf8');
}

export async function saveNovelDocument(doc: NovelDocumentStored): Promise<NovelDocumentStored> {
  let nextFolderPath = doc.novelFolderPath;
  const nextCasePath = doc.casePath ?? null;

  if (nextCasePath) {
    if (!isSafePath(nextCasePath)) {
      throw new Error('Invalid case path');
    }
    const novelsPath = getCaseNovelsPath(nextCasePath);
    await fs.mkdir(novelsPath, { recursive: true });
    nextFolderPath = getNovelFolderPath(novelsPath, doc.id);
  } else {
    const libraryPath = await getNovelLibraryPath();
    nextFolderPath = getNovelFolderPath(libraryPath, doc.id);
  }

  const currentPath = path.normalize(doc.novelFolderPath);
  const targetPath = path.normalize(nextFolderPath);

  if (currentPath !== targetPath) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.rename(currentPath, targetPath);
  }

  const nextDoc: NovelDocumentStored = {
    ...doc,
    casePath: nextCasePath,
    novelFolderPath: nextFolderPath,
  };

  await writeNovelDocument(nextDoc);
  return nextDoc;
}

async function scanNovelFolder(
  novelFolderPath: string,
  casePath: string | null,
  caseName?: string
): Promise<NovelListEntryStored | null> {
  const jsonPath = getNovelJsonPath(novelFolderPath);
  if (!existsSync(jsonPath)) return null;
  try {
    const [raw, stats] = await Promise.all([fs.readFile(jsonPath, 'utf8'), fs.stat(jsonPath)]);
    const id = extractJsonStringField(raw, 'id') ?? path.basename(novelFolderPath);
    const title = extractJsonStringField(raw, 'title') ?? 'Untitled Novel';
    const docCasePath = extractJsonNullableStringField(raw, 'casePath');
    return {
      id,
      title,
      novelFolderPath,
      casePath: docCasePath ?? casePath,
      caseName,
      modified: stats.mtimeMs,
      pageCount: countTopLevelArrayObjects(raw, 'pages'),
    };
  } catch (error) {
    logger.warn(`Failed to read novel at ${novelFolderPath}:`, error);
    return null;
  }
}

export async function listNovelsInDirectory(
  basePath: string,
  casePath: string | null,
  caseName?: string
): Promise<NovelListEntryStored[]> {
  if (!isSafePath(basePath)) return [];
  try {
    const entries = await fs.readdir(basePath, { withFileTypes: true });
    const folders = entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'));
    const results = await mapWithConcurrency(folders, LIST_SCAN_CONCURRENCY, async (entry) => {
      const novelFolderPath = path.join(basePath, entry.name);
      return scanNovelFolder(novelFolderPath, casePath, caseName);
    });
    return results.filter((r): r is NovelListEntryStored => r !== null).sort((a, b) => b.modified - a.modified);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function listAllNovels(): Promise<NovelListEntryStored[]> {
  const libraryPath = await getNovelLibraryPath();
  const archiveDrive = await getArchiveDrive();

  const [globalNovels, caseNovels] = await Promise.all([
    listNovelsInDirectory(libraryPath, null),
    archiveDrive ? scanCaseNovels(archiveDrive) : Promise.resolve([] as NovelListEntryStored[]),
  ]);

  const combined = [...globalNovels, ...caseNovels];
  combined.sort((a, b) => b.modified - a.modified);
  return combined;
}

async function scanCaseNovels(archiveDrive: string): Promise<NovelListEntryStored[]> {
  try {
    const entries = await fs.readdir(archiveDrive, { withFileTypes: true });
    const caseFolders = entries.filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        entry.name !== 'NovelLibrary' &&
        entry.name !== 'MapLibrary' &&
        entry.name !== 'TextLibrary'
    );

    const caseResults = await mapWithConcurrency(caseFolders, LIST_SCAN_CONCURRENCY, async (entry) => {
      const casePath = path.join(archiveDrive, entry.name);
      const novelsPath = getCaseNovelsPath(casePath);
      return listNovelsInDirectory(novelsPath, casePath, entry.name);
    });

    return caseResults.flat();
  } catch (error) {
    logger.warn('Failed to scan case novels:', error);
    return [];
  }
}

export async function listCaseNovels(casePath: string): Promise<NovelListEntryStored[]> {
  if (!isSafePath(casePath)) {
    throw new Error('Invalid case path');
  }
  const novelsPath = getCaseNovelsPath(casePath);
  await fs.mkdir(novelsPath, { recursive: true });
  const caseName = path.basename(casePath);
  return listNovelsInDirectory(novelsPath, casePath, caseName);
}

export async function createNovel(
  title: string,
  casePath?: string | null,
  bookSizeId?: string | null
): Promise<NovelDocumentStored> {
  const novelId = randomUUID();
  let novelFolderPath: string;
  let resolvedCasePath: string | null = null;

  if (casePath) {
    if (!isSafePath(casePath)) {
      throw new Error('Invalid case path');
    }
    const novelsPath = getCaseNovelsPath(casePath);
    await fs.mkdir(novelsPath, { recursive: true });
    novelFolderPath = getNovelFolderPath(novelsPath, novelId);
    resolvedCasePath = casePath;
  } else {
    const libraryPath = await getNovelLibraryPath();
    novelFolderPath = getNovelFolderPath(libraryPath, novelId);
  }

  await fs.mkdir(getNovelAssetsPath(novelFolderPath), { recursive: true });
  const doc = createEmptyNovelDocument(
    title,
    novelFolderPath,
    resolvedCasePath,
    bookSizeId || DEFAULT_BOOK_SIZE_ID
  );
  doc.id = novelId;
  await writeNovelDocument(doc);
  return doc;
}

export async function deleteNovel(novelFolderPath: string): Promise<void> {
  if (!isSafePath(novelFolderPath)) {
    throw new Error('Invalid novel folder path');
  }
  await fs.rm(novelFolderPath, { recursive: true, force: true });
}

export async function moveNovelToCase(
  novelFolderPath: string,
  casePath: string
): Promise<NovelDocumentStored> {
  const doc = await readNovelDocument(novelFolderPath);
  doc.casePath = casePath;
  return saveNovelDocument(doc);
}

export async function moveNovelToLibrary(novelFolderPath: string): Promise<NovelDocumentStored> {
  const doc = await readNovelDocument(novelFolderPath);
  doc.casePath = null;
  return saveNovelDocument(doc);
}

export async function copyNovelAssetToNovel(
  novelFolderPath: string,
  sourcePath: string,
  assetId: string
): Promise<{ relativePath: string; vaultPath: string; fileName: string }> {
  if (!isSafePath(novelFolderPath) || !isSafePath(sourcePath)) {
    throw new Error('Invalid path');
  }
  const fileName = path.basename(sourcePath);
  const ext = path.extname(fileName);
  const destFileName = `${assetId}${ext}`;
  const assetsPath = getNovelAssetsPath(novelFolderPath);
  await fs.mkdir(assetsPath, { recursive: true });
  const vaultPath = path.join(assetsPath, destFileName);
  await fs.copyFile(sourcePath, vaultPath);
  return {
    relativePath: path.join(NOVEL_ASSETS_DIR, destFileName),
    vaultPath,
    fileName,
  };
}

export async function writeNovelAssetFromDataUrl(
  novelFolderPath: string,
  relativePath: string,
  dataUrl: string
): Promise<void> {
  if (!isSafePath(novelFolderPath)) {
    throw new Error('Invalid path');
  }
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL');
  }
  const normalized = relativePath.replace(/\\/g, '/');
  const fullPath = normalized.startsWith(`${NOVEL_ASSETS_DIR}/`)
    ? path.join(novelFolderPath, normalized)
    : path.join(getNovelAssetsPath(novelFolderPath), path.basename(normalized));
  if (!isSafePath(fullPath)) {
    throw new Error('Invalid asset path');
  }
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, Buffer.from(match[2], 'base64'));
}

export async function exportNovelToPdf(
  novelFolderPath: string,
  destFilePath: string
): Promise<string> {
  if (!isSafePath(novelFolderPath) || !isSafePath(destFilePath)) {
    throw new Error('Invalid path');
  }
  const doc = await readNovelDocument(novelFolderPath);
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 72;
  const maxWidth = pageWidth - margin * 2;

  for (const page of doc.pages) {
    const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    if (page.type === 'cover') {
      const titleSize = 24;
      const titleWidth = boldFont.widthOfTextAtSize(doc.settings.coverTitle, titleSize);
      pdfPage.drawText(doc.settings.coverTitle, {
        x: (pageWidth - titleWidth) / 2,
        y: pageHeight / 2 + 24,
        size: titleSize,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      if (doc.settings.coverSubtitle) {
        const subSize = 14;
        const subWidth = font.widthOfTextAtSize(doc.settings.coverSubtitle, subSize);
        pdfPage.drawText(doc.settings.coverSubtitle, {
          x: (pageWidth - subWidth) / 2,
          y: pageHeight / 2 - 12,
          size: subSize,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
      if (doc.settings.coverAuthor) {
        const authorSize = 12;
        const authorWidth = font.widthOfTextAtSize(doc.settings.coverAuthor, authorSize);
        pdfPage.drawText(doc.settings.coverAuthor, {
          x: (pageWidth - authorWidth) / 2,
          y: margin + 48,
          size: authorSize,
          font,
          color: rgb(0.25, 0.25, 0.25),
        });
      }
      if (doc.settings.showCoverEditionBadge !== false) {
        const editionLabel = 'Vault Research Edition';
        const editionSize = 9;
        const editionWidth = font.widthOfTextAtSize(editionLabel, editionSize);
        pdfPage.drawText(editionLabel, {
          x: (pageWidth - editionWidth) / 2,
          y: margin,
          size: editionSize,
          font,
          color: rgb(0.45, 0.45, 0.45),
        });
      }
      continue;
    }

    const plainText = page.contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plainText.split(' ').filter(Boolean);
    let line = '';
    const lineHeight = doc.settings.fontSize * 1.4;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, doc.settings.fontSize);
      if (testWidth > maxWidth && line) {
        pdfPage.drawText(line, { x: margin, y, size: doc.settings.fontSize, font, color: rgb(0.1, 0.1, 0.1) });
        y -= lineHeight;
        line = word;
        if (y < margin) break;
      } else {
        line = testLine;
      }
    }
    if (line && y >= margin) {
      pdfPage.drawText(line, { x: margin, y, size: doc.settings.fontSize, font, color: rgb(0.1, 0.1, 0.1) });
    }
  }

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(destFilePath, pdfBytes);
  return destFilePath;
}

function htmlToPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function exportNovelToDocx(
  novelFolderPath: string,
  destFilePath: string
): Promise<string> {
  if (!isSafePath(novelFolderPath) || !isSafePath(destFilePath)) {
    throw new Error('Invalid path');
  }
  const doc = await readNovelDocument(novelFolderPath);
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx');

  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(doc.settings.coverTitle)],
    }),
  ];

  if (doc.settings.coverSubtitle) {
    children.push(
      new Paragraph({
        children: [new TextRun(doc.settings.coverSubtitle)],
      })
    );
  }

  if (doc.settings.coverAuthor) {
    children.push(
      new Paragraph({
        children: [new TextRun(doc.settings.coverAuthor)],
      })
    );
  }

  if (doc.settings.showCoverEditionBadge !== false) {
    children.push(
      new Paragraph({
        children: [new TextRun('Vault Research Edition')],
      })
    );
  }

  children.push(new Paragraph({ children: [new TextRun('')] }));

  for (const page of doc.pages) {
    if (page.type === 'cover') continue;
    const text = htmlToPlainText(page.contentHtml);
    if (!text) continue;
    children.push(
      new Paragraph({
        children: [new TextRun({ text, size: doc.settings.fontSize * 2 })],
      })
    );
  }

  const document = new Document({
    sections: [{ children }],
  });
  const buffer = await Packer.toBuffer(document);
  await fs.writeFile(destFilePath, buffer);
  return destFilePath;
}

export async function exportNovelToEpub(
  novelFolderPath: string,
  destFilePath: string
): Promise<string> {
  if (!isSafePath(novelFolderPath) || !isSafePath(destFilePath)) {
    throw new Error('Invalid path');
  }
  const doc = await readNovelDocument(novelFolderPath);
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const bookId = doc.id;
  const title = doc.settings.coverTitle || doc.title;
  const contentPages = doc.pages.filter((page) => page.type === 'content');

  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  const navPoints: string[] = [];
  const assetsSrc = getNovelAssetsPath(novelFolderPath);

  if (existsSync(assetsSrc)) {
    const assetFiles = await fs.readdir(assetsSrc);
    for (const fileName of assetFiles) {
      const assetPath = path.join(assetsSrc, fileName);
      const stat = await fs.stat(assetPath);
      if (!stat.isFile()) continue;
      const zipPath = `OEBPS/assets/${fileName}`;
      const data = await fs.readFile(assetPath);
      zip.file(zipPath, data);
      manifestItems.push(
        `<item id="asset-${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}" href="assets/${escapeXml(fileName)}" media-type="image/jpeg"/>`
      );
    }
  }

  contentPages.forEach((page, index) => {
    const chapterId = `chapter-${index + 1}`;
    const fileName = `${chapterId}.xhtml`;
    const bodyHtml = page.contentHtml || '<p>&nbsp;</p>';
    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Page ${index + 1}</title></head>
<body>${bodyHtml}</body>
</html>`;
    zip.file(`OEBPS/${fileName}`, xhtml);
    manifestItems.push(
      `<item id="${chapterId}" href="${fileName}" media-type="application/xhtml+xml"/>`
    );
    spineItems.push(`<itemref idref="${chapterId}"/>`);
    navPoints.push(
      `<navPoint id="nav-${index + 1}" playOrder="${index + 1}">
        <navLabel><text>Page ${index + 1}</text></navLabel>
        <content src="${fileName}"/>
      </navPoint>`
    );
  });

  const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeXml(title)}</title></head>
<body>
  <h1>${escapeXml(title)}</h1>
  ${doc.settings.coverSubtitle ? `<h2>${escapeXml(doc.settings.coverSubtitle)}</h2>` : ''}
  ${doc.settings.coverAuthor ? `<p>${escapeXml(doc.settings.coverAuthor)}</p>` : ''}
  ${doc.settings.showCoverEditionBadge !== false ? '<p><em>Vault Research Edition</em></p>' : ''}
</body>
</html>`;
  zip.file('OEBPS/cover.xhtml', coverXhtml);
  manifestItems.unshift(
    `<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`
  );
  spineItems.unshift(`<itemref idref="cover"/>`);
  navPoints.unshift(
    `<navPoint id="nav-cover" playOrder="0">
      <navLabel><text>Cover</text></navLabel>
      <content src="cover.xhtml"/>
    </navPoint>`
  );

  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    ${doc.settings.coverAuthor ? `<dc:creator>${escapeXml(doc.settings.coverAuthor)}</dc:creator>` : ''}
    <dc:identifier id="book-id">${escapeXml(bookId)}</dc:identifier>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`
  );

  zip.file(
    'OEBPS/toc.ncx',
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(bookId)}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
    ${navPoints.join('\n    ')}
  </navMap>
</ncx>`
  );

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(destFilePath, buffer);
  return destFilePath;
}

export async function exportNovelToHtml(
  novelFolderPath: string,
  destDirectory: string
): Promise<string> {
  if (!isSafePath(novelFolderPath) || !isSafePath(destDirectory)) {
    throw new Error('Invalid path');
  }
  const doc = await readNovelDocument(novelFolderPath);
  const exportFolderName = `${doc.title.replace(/[<>:"/\\|?*]/g, '_')}_${doc.id.slice(0, 8)}`;
  const exportPath = path.join(destDirectory, exportFolderName);
  await fs.mkdir(exportPath, { recursive: true });

  const assetsSrc = getNovelAssetsPath(novelFolderPath);
  if (existsSync(assetsSrc)) {
    await fs.cp(assetsSrc, path.join(exportPath, NOVEL_ASSETS_DIR), { recursive: true });
  }

  const htmlPages = doc.pages
    .map(
      (page, index) =>
        `<section class="page" data-index="${index}"><div class="content">${page.contentHtml || '&nbsp;'}</div></section>`
    )
    .join('\n');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${doc.title}</title>
<style>body{font-family:${formatFontFamilyCss(doc.settings.fontFamily)};font-size:${doc.settings.fontSize}pt;max-width:800px;margin:0 auto;padding:2rem;}
.page{page-break-after:always;margin-bottom:2rem;min-height:600px;border:1px solid #ddd;padding:2rem;}</style></head>
<body><h1>${doc.settings.coverTitle}</h1>${htmlPages}</body></html>`;

  await fs.writeFile(path.join(exportPath, 'index.html'), html, 'utf8');
  await fs.writeFile(path.join(exportPath, NOVEL_JSON_FILENAME), JSON.stringify(doc, null, 2), 'utf8');
  return exportPath;
}
