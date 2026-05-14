import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { parseMarkdown } from '../services/markdownParser';
import { ParsedBlock, DocumentMeta } from '../services/types';
import { INITIAL_CONTENT_ZH, INITIAL_CONTENT_EN } from '../constants/defaultContent';

interface MarkdownDocument {
  fileName: string;
  filePath?: string | null;
  content: string;
}

export const useEditorState = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.language.split('-')[0];

  const getInitialContent = (lang: string) => lang.startsWith('zh') ? INITIAL_CONTENT_ZH : INITIAL_CONTENT_EN;

  const [content, setContent] = useState(() => {
    return localStorage.getItem('draft_content') || getInitialContent(i18n.language);
  });
  
  const [parsedBlocks, setParsedBlocks] = useState<ParsedBlock[]>([]);
  const [documentMeta, setDocumentMeta] = useState<DocumentMeta>({});
  const [imageRegistry, setImageRegistry] = useState<Record<string, string>>({});
  const [sourceFileName, setSourceFileName] = useState<string | null>(() => localStorage.getItem('draft_source_file'));
  const [sourceFilePath, setSourceFilePath] = useState<string | null>(null);

  const registerImage = (id: string, base64: string) => {
    setImageRegistry(prev => ({ ...prev, [id]: base64 }));
  };

  const loadMarkdownContent = useCallback((fileName: string, text: string, filePath?: string | null) => {
    setContent(text);
    setSourceFileName(fileName);
    setSourceFilePath(filePath || null);
    setImageRegistry({});
    localStorage.setItem('draft_content', text);
    localStorage.setItem('draft_source_file', fileName);
  }, []);

  const openMarkdownFile = async (file: File) => {
    const text = await readFileAsText(file);
    loadMarkdownContent(file.name, text, null);
  };

  const openMarkdownFromDialog = async () => {
    if (!isTauriRuntime()) return false;

    const { invoke } = await import('@tauri-apps/api/core');
    const document = await invoke<MarkdownDocument | null>('open_markdown_file');
    if (document) {
      loadMarkdownContent(document.fileName, document.content, document.filePath);
    }
    return true;
  };

  const setMarkdownSource = useCallback((fileName: string, filePath?: string | null) => {
    setSourceFileName(fileName);
    setSourceFilePath(filePath || null);
    localStorage.setItem('draft_source_file', fileName);
  }, []);

  // Parsing & Auto-save (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const { blocks, meta } = parseMarkdown(content);
        setParsedBlocks(blocks);
        setDocumentMeta(meta);
        localStorage.setItem('draft_content', content);
      } catch (e) {
        console.error("Markdown parsing error:", e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [content]);

  // Language Toggle Logic
  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    
    if (confirm(t('switchLangConfirm'))) {
      i18n.changeLanguage(nextLang);
      setContent(getInitialContent(nextLang));
      localStorage.removeItem('draft_content');
      localStorage.removeItem('draft_source_file');
      setSourceFileName(null);
      setSourceFilePath(null);
      setImageRegistry({});
    }
  };

  // Reset Logic
  const resetToDefault = () => {
    if (confirm(t('resetConfirm'))) {
      setContent(getInitialContent(i18n.language));
      localStorage.removeItem('draft_content');
      localStorage.removeItem('draft_source_file');
      setSourceFileName(null);
      setSourceFilePath(null);
      setImageRegistry({});
    }
  };

  return {
    content,
    setContent,
    parsedBlocks,
    documentMeta,
    imageRegistry,
    registerImage,
    sourceFileName,
    sourceFilePath,
    loadMarkdownContent,
    openMarkdownFile,
    openMarkdownFromDialog,
    setMarkdownSource,
    language,
    toggleLanguage,
    resetToDefault,
    t // Export translation helper if needed
  };
};

function isTauriRuntime() {
  return '__TAURI_INTERNALS__' in window;
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
