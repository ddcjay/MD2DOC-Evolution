import type {
  CalloutKind,
  ChatAlignment,
  DocumentMeta,
  HeadingLevel,
  InlineSegment,
  ListItem,
  MarkdownBlock,
  ParseResult,
  TableAlignment,
} from './types';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)$/;

export function parseMarkdown(markdown: string): ParseResult {
  const normalized = markdown.replace(/\r\n?/g, '\n');
  const { content, meta, lineOffset } = parseFrontmatter(normalized);
  const lines = content.split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const sourceLine = i + 1 + lineOffset;

    if (!trimmed) {
      i += 1;
      continue;
    }

    const fence = line.match(/^```(.*)\s*$/);
    if (fence) {
      const parsedFence = parseFenceInfo(fence[1].trim());
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({
        type: 'code',
        language: parsedFence.language,
        showLineNumbers: parsedFence.showLineNumbers,
        text: code.join('\n'),
        sourceLine,
      });
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length as HeadingLevel,
        text: heading[2].trim(),
        sourceLine,
      });
      i += 1;
      continue;
    }

    if (/^\[toc\]$/i.test(trimmed)) {
      const tocLines: string[] = [];
      i += 1;
      while (i < lines.length && isListLine(lines[i])) {
        tocLines.push(stripListMarker(lines[i]));
        i += 1;
      }
      blocks.push({ type: 'toc', text: tocLines.join('\n'), sourceLine });
      continue;
    }

    if (/^([-*_])(?:\s*\1){2,}\s*$/.test(trimmed)) {
      blocks.push({ type: 'hr', sourceLine });
      i += 1;
      continue;
    }

    if (isTableStart(lines, i)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const { rows, alignments } = parseTable(tableLines);
      if (rows.length) blocks.push({ type: 'table', rows, alignments, sourceLine });
      continue;
    }

    if (isListLine(line)) {
      const items: ListItem[] = [];
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      while (i < lines.length && isListLine(lines[i])) {
        const item = parseListItem(lines[i]);
        items.push(item);
        i += 1;
      }
      blocks.push({
        type: 'list',
        ordered,
        items,
        sourceLine,
      });
      continue;
    }

    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      const callout = parseCallout(quoteLines);
      if (callout) {
        blocks.push({ type: 'callout', kind: callout.kind, text: callout.text, sourceLine });
      } else {
        blocks.push({ type: 'quote', text: quoteLines.join('\n').trim(), sourceLine });
      }
      continue;
    }

    const chat = parseChatLine(line);
    if (chat) {
      blocks.push({ type: 'chat', ...chat, sourceLine });
      i += 1;
      continue;
    }

    const image = trimmed.match(IMAGE_RE);
    if (image) {
      blocks.push({
        type: 'image',
        alt: image[1],
        src: image[2],
        title: image[3],
        sourceLine,
      });
      i += 1;
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !startsBlock(lines, i)) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' '), sourceLine });
  }

  return { blocks, meta };
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  return parseMarkdown(markdown).blocks;
}

export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const re = /(!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)|\[([^\]]+)\]\(([^)]+)\)|<u>([\s\S]+?)<\/u>|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|`([^`]+)`|\[([A-Za-z0-9+_. -]{1,18})\])/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text))) {
    if (match.index > last) {
      segments.push({ type: 'text', text: text.slice(last, match.index) });
    }

    if (match[1]?.startsWith('![')) {
      segments.push({ type: 'image', text: match[2] || '', alt: match[2] || '', href: match[3], title: match[4] });
    } else if (match[5] && match[6]) {
      segments.push({ type: 'link', text: match[5], href: match[6] });
    } else if (match[7]) {
      segments.push({ type: 'underline', text: match[7] });
    } else if (match[8] || match[9]) {
      segments.push({ type: 'bold', text: match[8] || match[9] });
    } else if (match[10] || match[11]) {
      segments.push({ type: 'italic', text: match[10] || match[11] });
    } else if (match[12]) {
      segments.push({ type: 'code', text: match[12] });
    } else if (match[13]) {
      segments.push({ type: 'kbd', text: match[13] });
    }

    last = re.lastIndex;
  }

  if (last < text.length) {
    segments.push({ type: 'text', text: text.slice(last) });
  }

  return segments.length ? segments : [{ type: 'text', text }];
}

function parseFrontmatter(text: string): { content: string; meta: DocumentMeta; lineOffset: number } {
  const match = text.match(FRONTMATTER_RE);
  if (!match) return { content: text, meta: {}, lineOffset: 0 };

  const meta: DocumentMeta = {};
  for (const rawLine of match[1].split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const pair = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!pair) continue;
    meta[pair[1]] = parseFrontmatterValue(pair[2]);
  }

  return {
    content: text.slice(match[0].length),
    meta,
    lineOffset: match[0].split('\n').length - 1,
  };
}

function parseFrontmatterValue(value: string): string | string[] | boolean | number {
  const trimmed = value.trim();
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === 'true';
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (/^\[.*\]$/.test(trimmed)) {
    return trimmed.slice(1, -1).split(',').map((item) => unquote(item.trim())).filter(Boolean);
  }
  if (trimmed.includes(',') && !/^['"]/.test(trimmed)) {
    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return unquote(trimmed);
}

function unquote(value: string): string {
  return value.replace(/^['"]|['"]$/g, '');
}

function parseFenceInfo(info: string): { language: string; showLineNumbers?: boolean } {
  if (!info) return { language: '' };
  const parts = info.split(':').map((part) => part.trim()).filter(Boolean);
  const language = parts[0] && !isLineNumberModifier(parts[0]) ? parts[0] : '';
  const modifier = parts.find(isLineNumberModifier);

  if (!modifier) return { language };
  if (['ln', 'line', 'lines', 'yes'].includes(modifier.toLowerCase())) {
    return { language, showLineNumbers: true };
  }
  return { language, showLineNumbers: false };
}

function isLineNumberModifier(value: string): boolean {
  return ['ln', 'line', 'lines', 'yes', 'no-ln', 'plain', 'no'].includes(value.toLowerCase());
}

function isTableStart(lines: string[], index: number): boolean {
  return Boolean(
    lines[index]?.trim().startsWith('|') &&
    lines[index + 1] &&
    /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1]),
  );
}

function parseTable(lines: string[]): { rows: string[][]; alignments: TableAlignment[] } {
  const alignments = parseAlignmentRow(lines[1] || '');
  const rows = lines
    .filter((line, index) => index !== 1)
    .map((line) => splitTableRow(line))
    .filter((row) => row.length > 0);

  return { rows, alignments };
}

function splitTableRow(row: string): string[] {
  const trimmed = row.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.replace(/\\\|/g, '|').trim());
}

function parseAlignmentRow(row: string): TableAlignment[] {
  return splitTableRow(row).map((cell) => {
    if (/^:-+:$/.test(cell)) return 'center';
    if (/^-+:$/.test(cell)) return 'right';
    if (/^:-+$/.test(cell)) return 'left';
    return undefined;
  });
}

function isListLine(line: string): boolean {
  return /^\s*(?:[-*+]|\d+[.)])\s+/.test(line);
}

function stripListMarker(line: string): string {
  return line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '').trim();
}

function parseListItem(line: string): ListItem {
  const match = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.+)$/);
  const indent = match?.[1]?.replace(/\t/g, '  ').length || 0;
  const marker = match?.[2] || '-';
  return {
    text: match?.[3]?.trim() || '',
    level: Math.min(2, Math.floor(indent / 2)),
    ordered: /^\d/.test(marker),
  };
}

function parseCallout(lines: string[]): { kind: CalloutKind; text: string } | null {
  const first = lines[0]?.trim();
  const marker = first?.match(/^\[!(TIP|NOTE|WARNING)\]\s*$/i);
  if (!marker) return null;
  return {
    kind: marker[1].toUpperCase() as CalloutKind,
    text: lines.slice(1).join('\n').trim(),
  };
}

function parseChatLine(line: string): { role: string; alignment: ChatAlignment; text: string } | null {
  const center = line.match(/^(.+?)\s*:":\s*(.*)$/);
  if (center) return { role: center[1].trim(), alignment: 'center', text: center[2].trim() };

  const left = line.match(/^(.+?)\s*"::\s*(.*)$/);
  if (left) return { role: left[1].trim(), alignment: 'left', text: left[2].trim() };

  const right = line.match(/^(.+?)\s*::"\s*(.*)$/);
  if (right) return { role: right[1].trim(), alignment: 'right', text: right[2].trim() };

  return null;
}

function startsBlock(lines: string[], index: number): boolean {
  const line = lines[index];
  const trimmed = line.trim();
  return Boolean(
    /^```/.test(line) ||
      /^(#{1,3})\s+/.test(line) ||
      /^\[toc\]$/i.test(trimmed) ||
      /^([-*_])(?:\s*\1){2,}\s*$/.test(trimmed) ||
      isTableStart(lines, index) ||
      isListLine(line) ||
      line.startsWith('>') ||
      parseChatLine(line) ||
      trimmed.match(IMAGE_RE),
  );
}
