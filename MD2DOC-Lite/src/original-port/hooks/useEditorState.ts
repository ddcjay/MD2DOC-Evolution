import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { parseMarkdown } from '../services/markdown';
import type { DocumentMeta, MarkdownBlock } from '../services/types';

export interface UseEditorStateOptions {
  initialContent?: string;
  storageKey?: string;
  parseDelayMs?: number;
}

export interface UseEditorStateResult {
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
  parsedBlocks: MarkdownBlock[];
  documentMeta: DocumentMeta;
  imageRegistry: Record<string, string>;
  registerImage: (id: string, base64: string) => void;
  resetToDefault: () => void;
}

function readDraft(storageKey: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeDraft(storageKey: string, content: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(storageKey, content);
  } catch {
    // Storage can be unavailable in private or embedded contexts.
  }
}

function removeDraft(storageKey: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Storage can be unavailable in private or embedded contexts.
  }
}

export function useEditorState(options: UseEditorStateOptions = {}): UseEditorStateResult {
  const { initialContent = '', storageKey = 'draft_content', parseDelayMs = 300 } = options;
  const [content, setContent] = useState(() => readDraft(storageKey) ?? initialContent);
  const [parsedBlocks, setParsedBlocks] = useState<MarkdownBlock[]>([]);
  const [documentMeta, setDocumentMeta] = useState<DocumentMeta>({});
  const [imageRegistry, setImageRegistry] = useState<Record<string, string>>({});

  const registerImage = useCallback((id: string, base64: string) => {
    setImageRegistry((current) => ({ ...current, [id]: base64 }));
  }, []);

  const resetToDefault = useCallback(() => {
    setContent(initialContent);
    setImageRegistry({});
    removeDraft(storageKey);
  }, [initialContent, storageKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const parsed = parseMarkdown(content);
      setParsedBlocks(parsed.blocks);
      setDocumentMeta(parsed.meta);
      writeDraft(storageKey, content);
    }, parseDelayMs);

    return () => window.clearTimeout(timer);
  }, [content, parseDelayMs, storageKey]);

  return {
    content,
    setContent,
    parsedBlocks,
    documentMeta,
    imageRegistry,
    registerImage,
    resetToDefault,
  };
}
