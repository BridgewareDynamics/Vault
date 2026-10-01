import fs from 'fs/promises';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * Export plain text (with line breaks) to a DOCX file.
 */
export async function exportPlainTextToDocx(finalText: string, exportPath: string): Promise<string> {
  const lines = finalText.length > 0 ? finalText.split('\n') : [''];
  const children = lines.map(
    (line) =>
      new Paragraph({
        children: [new TextRun(line)],
      }),
  );

  const document = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(document);
  await fs.writeFile(exportPath, buffer);
  return exportPath;
}

/**
 * Strip HTML content to plain text while preserving line breaks from block elements.
 */
export function htmlToExportPlainText(content: string): string {
  const plainText = content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  const textWithBreaks = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return textWithBreaks || plainText;
}

export function buildRtfContent(finalText: string): string {
  const escapedText = finalText
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\n/g, '\\par ');

  return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 ${escapedText} }`;
}
