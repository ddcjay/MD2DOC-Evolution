import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
  type FileChild,
  type ParagraphChild,
} from 'docx';
import { parseInline } from './markdown';
import type { CalloutKind, DocxExportOptions, DocumentMeta, MarkdownBlock, ParseResult } from './types';

const CM_TO_TWIPS = 567;
const DEFAULT_WIDTH_CM = 17;
const DEFAULT_HEIGHT_CM = 23;
const FONT = { ascii: 'Aptos', hAnsi: 'Aptos', eastAsia: 'Microsoft JhengHei', cs: 'Aptos' };

const COLORS = {
  text: '111827',
  muted: '64748B',
  border: 'CBD5E1',
  codeBg: 'F1F5F9',
  kbdBg: 'E2E8F0',
  link: '2563EB',
  callout: {
    TIP: { bg: 'ECFDF5', border: '10B981' },
    NOTE: { bg: 'EFF6FF', border: '3B82F6' },
    WARNING: { bg: 'FFF7ED', border: 'F97316' },
  },
};

export function buildDocx(input: ParseResult | MarkdownBlock[], options: DocxExportOptions = {}): Document {
  const blocks = Array.isArray(input) ? input : input.blocks;
  const meta = { ...(Array.isArray(input) ? {} : input.meta), ...options.meta };
  const children = blocks.flatMap((block) => blockToDocx(block, { ...options, meta }));

  return new Document({
    title: asString(meta.title),
    subject: asString(meta.subject),
    creator: asString(meta.author),
    keywords: keywordsToString(meta.keywords),
    description: asString(meta.subject),
    numbering: createNumbering(),
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: COLORS.text },
          paragraph: { spacing: { after: 160, line: 320 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: (options.widthCm || DEFAULT_WIDTH_CM) * CM_TO_TWIPS,
              height: (options.heightCm || DEFAULT_HEIGHT_CM) * CM_TO_TWIPS,
            },
            margin: { top: 900, right: 900, bottom: 900, left: 900, header: 360, footer: 360 },
          },
        },
        headers: createHeaders(meta),
        footers: createFooters(meta),
        children,
      },
    ],
  });
}

export async function generateDocx(input: ParseResult | MarkdownBlock[], options: DocxExportOptions = {}): Promise<Blob> {
  return Packer.toBlob(buildDocx(input, options));
}

function blockToDocx(block: MarkdownBlock, options: DocxExportOptions): FileChild[] {
  switch (block.type) {
    case 'heading':
      return [
        new Paragraph({
          heading: block.level === 1 ? HeadingLevel.HEADING_1 : block.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
          spacing: { before: block.level === 1 ? 240 : 180, after: 120 },
          children: inlineRuns(block.text),
        }),
      ];
    case 'paragraph':
      return [paragraph(block.text)];
    case 'quote':
      return [borderedParagraph(block.text, COLORS.border, 'F8FAFC')];
    case 'callout':
      return [calloutParagraph(block.kind, block.text)];
    case 'chat':
      return [chatParagraph(block.role, block.text, block.alignment)];
    case 'code':
      return [codeTable(block.text, block.language, block.showLineNumbers ?? options.showLineNumbers ?? true)];
    case 'list':
      return block.items.map(
        (item) =>
          new Paragraph({
            children: inlineRuns(item.text),
            bullet: item.ordered ? undefined : { level: item.level },
            numbering: item.ordered ? { reference: 'lite-numbering', level: item.level } : undefined,
            spacing: { after: 80 },
          }),
      );
    case 'ul':
      return block.items.map((item) => new Paragraph({ bullet: { level: 0 }, children: inlineRuns(item), spacing: { after: 80 } }));
    case 'ol':
      return block.items.map((item) => new Paragraph({ numbering: { reference: 'lite-numbering', level: 0 }, children: inlineRuns(item), spacing: { after: 80 } }));
    case 'table':
      return [docxTable(block.rows)];
    case 'hr':
      return [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.border } }, spacing: { before: 120, after: 160 } })];
    case 'toc':
      return tocChildren(block.text);
    case 'image':
      return [imageParagraph(block.src, block.alt, block.title)];
    default:
      return [];
  }
}

function paragraph(text: string): Paragraph {
  return new Paragraph({ children: inlineRuns(text), spacing: { after: 160, line: 320 } });
}

function borderedParagraph(text: string, color: string, fill: string): Paragraph {
  return new Paragraph({
    children: linesToRuns(text),
    border: { left: { style: BorderStyle.SINGLE, size: 12, color, space: 12 } },
    shading: { fill },
    indent: { left: 240 },
    spacing: { before: 120, after: 160, line: 320 },
  });
}

function calloutParagraph(kind: CalloutKind, text: string): Paragraph {
  const theme = COLORS.callout[kind];
  return new Paragraph({
    children: [new TextRun({ text: `[ ${kind} ]`, bold: true, font: FONT }), new TextRun({ text: '', break: 1 }), ...linesToRuns(text)],
    shading: { fill: theme.bg },
    border: {
      top: { style: kind === 'NOTE' ? BorderStyle.DASHED : BorderStyle.SINGLE, size: kind === 'WARNING' ? 14 : 10, color: theme.border },
      bottom: { style: kind === 'NOTE' ? BorderStyle.DASHED : BorderStyle.SINGLE, size: kind === 'WARNING' ? 14 : 10, color: theme.border },
      left: { style: kind === 'NOTE' ? BorderStyle.DASHED : BorderStyle.SINGLE, size: kind === 'WARNING' ? 18 : 12, color: theme.border, space: 12 },
      right: { style: kind === 'NOTE' ? BorderStyle.DASHED : BorderStyle.SINGLE, size: kind === 'WARNING' ? 14 : 10, color: theme.border },
    },
    indent: { left: 180, right: 180 },
    spacing: { before: 160, after: 180, line: 320 },
  });
}

function chatParagraph(role: string, text: string, alignment: 'left' | 'right' | 'center'): Paragraph {
  const isRight = alignment === 'right';
  const isCenter = alignment === 'center';
  return new Paragraph({
    alignment: isRight ? AlignmentType.RIGHT : isCenter ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [
      new TextRun({ text: `${role}:`, bold: true, font: FONT, color: COLORS.muted }),
      new TextRun({ text: '', break: 1 }),
      ...inlineRuns(text),
    ],
    border: {
      top: { style: isCenter ? BorderStyle.DOUBLE : BorderStyle.DOTTED, size: 8, color: COLORS.border },
      bottom: { style: isCenter ? BorderStyle.DOUBLE : BorderStyle.DOTTED, size: 8, color: COLORS.border },
      left: { style: isCenter ? BorderStyle.DOUBLE : BorderStyle.DOTTED, size: 8, color: COLORS.border },
      right: { style: isCenter ? BorderStyle.DOUBLE : BorderStyle.DOTTED, size: 8, color: COLORS.border },
    },
    shading: { fill: isCenter ? 'F8FAFC' : isRight ? 'FFFFFF' : 'F1F5F9' },
    indent: isCenter ? { left: 720, right: 720 } : isRight ? { left: 1440 } : { right: 1440 },
    spacing: { before: 180, after: 180, line: 320 },
  });
}

function codeTable(text: string, language: string, showLineNumbers: boolean): Table {
  const rows: TableRow[] = [];

  if (language) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: showLineNumbers ? 2 : 1,
            shading: { fill: 'E2E8F0' },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: language.toUpperCase(), bold: true, size: 16, color: COLORS.muted, font: FONT })],
              }),
            ],
          }),
        ],
      }),
    );
  }

  text.split('\n').forEach((line, index) => {
    const cells: TableCell[] = [];
    if (showLineNumbers) {
      cells.push(
        new TableCell({
          width: { size: 720, type: WidthType.DXA },
          shading: { fill: COLORS.codeBg },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: String(index + 1), color: COLORS.muted, size: 18, font: FONT })] })],
        }),
      );
    }
    cells.push(
      new TableCell({
        shading: { fill: COLORS.codeBg },
        children: [new Paragraph({ children: [new TextRun({ text: line || ' ', font: 'Consolas', size: 18 })], spacing: { before: 0, after: 0, line: 260 } })],
      }),
    );
    rows.push(new TableRow({ children: cells }));
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
  });
}

function docxTable(rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row, rowIndex) =>
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                shading: rowIndex === 0 ? { fill: 'F1F5F9' } : undefined,
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                children: [new Paragraph({ children: inlineRuns(cell) })],
              }),
          ),
        }),
    ),
  });
}

function tocChildren(text?: string): FileChild[] {
  if (!text?.trim()) {
    return [
      new Paragraph({ children: [new TextRun({ text: 'Table of Contents', bold: true, size: 30, font: FONT })], alignment: AlignmentType.CENTER }),
      new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-3' }),
    ];
  }

  return [
    new Paragraph({ children: [new TextRun({ text: 'Table of Contents', bold: true, size: 30, font: FONT })], alignment: AlignmentType.CENTER }),
    ...text.split('\n').filter(Boolean).map((line) => new Paragraph({ children: [new TextRun({ text: line, font: FONT })], spacing: { after: 80 } })),
  ];
}

function imageParagraph(src: string, alt: string, title?: string): Paragraph {
  const image = imageRunFromSource(src, alt, title);
  if (image) return new Paragraph({ children: [image], alignment: AlignmentType.CENTER, spacing: { after: 160 } });

  return new Paragraph({
    children: [
      new TextRun({ text: `[Image: ${alt || 'untitled'}] `, bold: true, font: FONT }),
      new TextRun({ text: src, color: COLORS.link, underline: { type: UnderlineType.SINGLE }, font: FONT }),
    ],
    spacing: { after: 160 },
  });
}

function inlineRuns(text: string): ParagraphChild[] {
  return parseInline(text).flatMap((segment): ParagraphChild[] => {
    if (segment.type === 'image' && segment.href) {
      const image = imageRunFromSource(segment.href, segment.alt || segment.text, segment.title);
      if (image) return [image];
      return [new TextRun({ text: `[Image: ${segment.alt || segment.text || segment.href}]`, color: COLORS.muted, font: FONT })];
    }

    const base = { text: segment.text, font: FONT };
    switch (segment.type) {
      case 'bold':
        return [new TextRun({ ...base, bold: true })];
      case 'italic':
        return [new TextRun({ ...base, italics: true, color: '1D4ED8' })];
      case 'underline':
        return [new TextRun({ ...base, color: COLORS.link, underline: { type: UnderlineType.SINGLE, color: COLORS.link } })];
      case 'code':
        return [new TextRun({ text: segment.text, font: 'Consolas', shading: { fill: COLORS.codeBg, type: ShadingType.CLEAR, color: 'auto' } })];
      case 'kbd':
        return [new TextRun({ ...base, bold: true, size: 18, shading: { fill: COLORS.kbdBg, type: ShadingType.CLEAR, color: 'auto' } })];
      case 'link':
        return [new TextRun({ ...base, color: COLORS.link, underline: { type: UnderlineType.SINGLE, color: COLORS.link } })];
      default:
        return [new TextRun(base)];
    }
  });
}

function linesToRuns(text: string): ParagraphChild[] {
  return text.split('\n').flatMap((line, index) => (index === 0 ? inlineRuns(line) : [new TextRun({ text: '', break: 1 }), ...inlineRuns(line)]));
}

function imageRunFromSource(src: string, alt: string, title?: string): ImageRun | null {
  const parsed = parseDataImage(src);
  if (!parsed) return null;

  return new ImageRun({
    data: parsed.data,
    type: parsed.type,
    transformation: { width: 360, height: 220 },
    altText: { title: title || alt || 'Markdown image', description: alt || src, name: alt || 'image' },
  });
}

function parseDataImage(src: string): { data: Uint8Array; type: 'png' | 'jpg' | 'gif' | 'bmp' } | null {
  const match = src.match(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,(.+)$/i);
  if (!match) return null;
  return {
    type: match[1].toLowerCase() === 'jpeg' ? 'jpg' : (match[1].toLowerCase() as 'png' | 'jpg' | 'gif' | 'bmp'),
    data: base64ToBytes(match[2]),
  };
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function createHeaders(meta: DocumentMeta): { default?: Header } {
  if (meta.header === false) return {};
  const headerText = typeof meta.header === 'string' ? meta.header : asString(meta.title);
  if (!headerText) return {};
  return {
    default: new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border, space: 6 } },
          children: [new TextRun({ text: headerText, color: COLORS.muted, size: 18, font: FONT })],
        }),
      ],
    }),
  };
}

function createFooters(meta: DocumentMeta): { default?: Footer } {
  if (meta.footer === false) return {};
  const footerText = typeof meta.footer === 'string' ? meta.footer : '';
  return {
    default: new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            ...(footerText ? [new TextRun({ text: `${footerText} `, color: COLORS.muted, size: 18, font: FONT })] : []),
            new TextRun({ children: [PageNumber.CURRENT], color: COLORS.muted, size: 18, font: FONT }),
          ],
        }),
      ],
    }),
  };
}

function createNumbering() {
  const indent = (level: number) => ({ left: 720 * (level + 1), hanging: 360 });
  return {
    config: [
      {
        reference: 'lite-numbering',
        levels: [0, 1, 2].map((level) => ({
          level,
          format: LevelFormat.DECIMAL,
          text: `%${level + 1}.`,
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: indent(level) } },
        })),
      },
      {
        reference: 'lite-bullets',
        levels: [0, 1, 2].map((level) => ({
          level,
          format: LevelFormat.BULLET,
          text: level === 0 ? '-' : level === 1 ? 'o' : '+',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: indent(level) } },
        })),
      },
    ],
  };
}

function asString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === false) return undefined;
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function keywordsToString(value: DocumentMeta['keywords']): string | undefined {
  return Array.isArray(value) ? value.join(', ') : asString(value);
}
