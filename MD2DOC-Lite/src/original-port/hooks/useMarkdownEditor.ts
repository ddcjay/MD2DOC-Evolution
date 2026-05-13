import { useWordCount } from './useWordCount';
import { useDocxExport } from './useDocxExport';
import { useEditorState, type UseEditorStateOptions } from './useEditorState';
import { useSyncScroll } from './useSyncScroll';

export function useMarkdownEditor(options: UseEditorStateOptions = {}) {
  const editorState = useEditorState(options);
  const wordCount = useWordCount(editorState.content);
  const scroll = useSyncScroll();
  const exportState = useDocxExport({
    content: editorState.content,
    parsedBlocks: editorState.parsedBlocks,
    documentMeta: editorState.documentMeta,
  });

  return {
    ...editorState,
    ...scroll,
    ...exportState,
    wordCount,
  };
}
