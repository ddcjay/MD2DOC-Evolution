import { useRef, useCallback } from 'react';

export const useSyncScroll = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const syncScroll = useCallback((source: HTMLElement, target: HTMLElement) => {
    if (isSyncingRef.current) return;

    const sourceMax = source.scrollHeight - source.clientHeight;
    const targetMax = target.scrollHeight - target.clientHeight;
    if (sourceMax <= 0 || targetMax <= 0) return;

    isSyncingRef.current = true;
    target.scrollTop = (source.scrollTop / sourceMax) * targetMax;
    window.requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }, []);

  const handleEditorScroll = useCallback(() => {
    if (!textareaRef.current || !previewRef.current) return;
    syncScroll(textareaRef.current, previewRef.current);
  }, [syncScroll]);

  const handlePreviewScroll = useCallback(() => {
    if (!textareaRef.current || !previewRef.current) return;
    syncScroll(previewRef.current, textareaRef.current);
  }, [syncScroll]);

  const scrollEditorToIndex = useCallback((index: number, content: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const safeIndex = Math.max(0, Math.min(index, content.length));
    textarea.focus();
    textarea.setSelectionRange(safeIndex, safeIndex);

    const lineNumber = content.slice(0, safeIndex).split(/\r\n|\r|\n/).length - 1;
    const lineHeight = getLineHeight(textarea);
    const targetTop = Math.max(0, lineNumber * lineHeight - textarea.clientHeight * 0.25);

    isSyncingRef.current = true;
    textarea.scrollTop = targetTop;
    window.requestAnimationFrame(() => {
      isSyncingRef.current = false;
      handleEditorScroll();
    });
  }, [handleEditorScroll]);

  return {
    textareaRef,
    previewRef,
    handleScroll: handleEditorScroll,
    handleEditorScroll,
    handlePreviewScroll,
    scrollEditorToIndex,
  };
};

function getLineHeight(element: HTMLElement) {
  const computed = window.getComputedStyle(element);
  const parsed = Number.parseFloat(computed.lineHeight);
  if (Number.isFinite(parsed)) return parsed;

  const fontSize = Number.parseFloat(computed.fontSize);
  return Number.isFinite(fontSize) ? fontSize * 1.8 : 28;
}
