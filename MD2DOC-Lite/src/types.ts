export type HeadingLevel = 1 | 2 | 3;

export type CalloutKind = 'TIP' | 'NOTE' | 'WARNING';

export type ChatAlignment = 'left' | 'right' | 'center';

export interface DocumentMeta {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string | string[];
  header?: boolean | string;
  footer?: boolean | string;
  [key: string]: string | string[] | boolean | number | undefined;
}

export interface InlineSegment {
  type: 'text' | 'bold' | 'italic' | 'underline' | 'code' | 'kbd' | 'link' | 'image';
  text: string;
  href?: string;
  title?: string;
  alt?: string;
}

export interface ListItem {
  text: string;
  level: number;
  ordered: boolean;
}

export type MarkdownBlock =
  | { type: 'heading'; level: HeadingLevel; text: string; sourceLine?: number }
  | { type: 'paragraph'; text: string; sourceLine?: number }
  | { type: 'quote'; text: string; sourceLine?: number }
  | { type: 'code'; language: string; text: string; showLineNumbers?: boolean; sourceLine?: number }
  | { type: 'list'; ordered: boolean; items: ListItem[]; sourceLine?: number }
  | { type: 'ul'; items: string[]; sourceLine?: number }
  | { type: 'ol'; items: string[]; sourceLine?: number }
  | { type: 'table'; rows: string[][]; alignments?: TableAlignment[]; sourceLine?: number }
  | { type: 'hr'; sourceLine?: number }
  | { type: 'toc'; text?: string; sourceLine?: number }
  | { type: 'callout'; kind: CalloutKind; text: string; sourceLine?: number }
  | { type: 'chat'; role: string; alignment: ChatAlignment; text: string; sourceLine?: number }
  | { type: 'image'; src: string; alt: string; title?: string; sourceLine?: number };

export type TableAlignment = 'left' | 'center' | 'right' | undefined;

export interface ParseResult {
  blocks: MarkdownBlock[];
  meta: DocumentMeta;
}

export interface DocxExportOptions {
  fileName?: string;
  widthCm?: number;
  heightCm?: number;
  showLineNumbers?: boolean;
  meta?: DocumentMeta;
}
