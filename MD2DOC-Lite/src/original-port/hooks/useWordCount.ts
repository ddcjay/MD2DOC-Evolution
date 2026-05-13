import { useMemo } from 'react';
import { countMarkdownWords } from '../utils/textProcessor';

export function useWordCount(text: string): number {
  return useMemo(() => countMarkdownWords(text), [text]);
}
