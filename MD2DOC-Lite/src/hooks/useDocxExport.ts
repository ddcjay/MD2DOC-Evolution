import { useState } from 'react';
import { PAGE_SIZES } from '../constants/meta';
import { generateDocx } from '../services/docxGenerator';
import { saveBlob, saveMarkdownContent } from '../services/saveFile';
import { ParsedBlock, DocumentMeta } from '../services/types';

interface UseDocxExportProps {
  content: string;
  parsedBlocks: ParsedBlock[];
  documentMeta: DocumentMeta;
  imageRegistry: Record<string, string>;
  sourceFileName?: string | null;
  sourceFilePath?: string | null;
  onMarkdownSaved?: (fileName: string, filePath?: string | null) => void;
}

const MESSAGE = {
  wordSuccess: '\u8f38\u51fa\u6210\u529f\uff1aWord \u6a94\u5df2\u5efa\u7acb\u3002',
  mdSuccess: '\u8f38\u51fa\u6210\u529f\uff1aMarkdown \u6a94\u5df2\u5efa\u7acb\u3002',
  mdSaved: '\u5132\u5b58\u6210\u529f\uff1aMarkdown \u6a94\u5df2\u66f4\u65b0\u3002',
  wordFailed: 'Word \u532f\u51fa\u5931\u6557\uff0c\u8acb\u78ba\u8a8d Markdown \u5167\u5bb9\u5f8c\u518d\u8a66\u4e00\u6b21\u3002',
  mdFailed: 'Markdown \u5132\u5b58\u5931\u6557\uff0c\u8acb\u7a0d\u5f8c\u518d\u8a66\u3002',
};

export const useDocxExport = ({
  content,
  parsedBlocks,
  documentMeta,
  imageRegistry,
  sourceFileName,
  sourceFilePath,
  onMarkdownSaved,
}: UseDocxExportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

  const handleDownload = async () => {
    if (parsedBlocks.length === 0) return;
    setIsGenerating(true);
    try {
      const sizeConfig = PAGE_SIZES[selectedSizeIndex] ?? PAGE_SIZES[0];
      const blob = await generateDocx(parsedBlocks, {
        widthCm: sizeConfig.width,
        heightCm: sizeConfig.height,
        showLineNumbers: true,
        meta: documentMeta,
        imageRegistry,
      });

      const fileName = sourceFileName
        ? `${stripMarkdownExtension(sourceFileName)}.docx`
        : `${safeName(documentMeta.title || 'Professional_Manuscript')}.docx`;

      await saveBlob(blob, fileName);
      alert(MESSAGE.wordSuccess);
    } catch (error) {
      console.error('Word Generation Failed:', error);
      alert(MESSAGE.wordFailed);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!content) return;
    try {
      const fileName = sourceFileName
        ? safeName(sourceFileName)
        : `${safeName(documentMeta.title || 'manuscript')}.md`;

      const savedFile = await saveMarkdownContent(content, fileName, sourceFilePath);
      if (!savedFile) return;

      onMarkdownSaved?.(savedFile.fileName, savedFile.filePath);
      alert(sourceFilePath ? MESSAGE.mdSaved : MESSAGE.mdSuccess);
    } catch (error) {
      console.error('Markdown Export Failed:', error);
      alert(MESSAGE.mdFailed);
    }
  };

  return {
    isGenerating,
    selectedSizeIndex,
    setSelectedSizeIndex,
    handleDownload,
    handleExportMarkdown,
    pageSizes: PAGE_SIZES,
  };
};

function safeName(value: unknown) {
  return String(value || '').replace(/[\\/:*?"<>|]/g, '_').trim() || 'manuscript';
}

function stripMarkdownExtension(fileName: string) {
  return safeName(fileName).replace(/\.(md|markdown|mdown|txt)$/i, '') || 'manuscript';
}
