import { useCallback, useState } from 'react';
import { PAGE_SIZES } from '../constants/meta';
import { generateDocx } from '../services/docx';
import type { DocumentMeta, MarkdownBlock } from '../services/types';
import { downloadBlob, safeFileName } from '../utils/browserFiles';

export interface UseDocxExportProps {
  content: string;
  parsedBlocks: MarkdownBlock[];
  documentMeta: DocumentMeta;
  showLineNumbers?: boolean;
}

export function useDocxExport({ content, parsedBlocks, documentMeta, showLineNumbers = true }: UseDocxExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

  const handleDownload = useCallback(async () => {
    if (!parsedBlocks.length) return;

    setIsGenerating(true);
    try {
      const size = PAGE_SIZES[selectedSizeIndex] ?? PAGE_SIZES[0];
      const fileName = safeFileName(documentMeta.title, 'md2doc-lite');
      const blob = await generateDocx(parsedBlocks, {
        fileName,
        widthCm: size.widthCm,
        heightCm: size.heightCm,
        showLineNumbers,
        meta: documentMeta,
      });

      downloadBlob(blob, `${fileName}.docx`);
    } finally {
      setIsGenerating(false);
    }
  }, [documentMeta, parsedBlocks, selectedSizeIndex, showLineNumbers]);

  const handleExportMarkdown = useCallback(() => {
    if (!content) return;

    const fileName = safeFileName(documentMeta.title, 'manuscript');
    downloadBlob(new Blob([content], { type: 'text/markdown;charset=utf-8' }), `${fileName}.md`);
  }, [content, documentMeta.title]);

  return {
    isGenerating,
    selectedSizeIndex,
    setSelectedSizeIndex,
    handleDownload,
    handleExportMarkdown,
    pageSizes: PAGE_SIZES,
  };
}
