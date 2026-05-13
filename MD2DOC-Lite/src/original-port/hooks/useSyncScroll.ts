import { useCallback, useRef } from 'react';

export function useSyncScroll<
  TSource extends HTMLElement = HTMLTextAreaElement,
  TTarget extends HTMLElement = HTMLDivElement,
>() {
  const sourceRef = useRef<TSource>(null);
  const targetRef = useRef<TTarget>(null);

  const syncScroll = useCallback(() => {
    const source = sourceRef.current;
    const target = targetRef.current;
    if (!source || !target) return;

    const sourceMax = source.scrollHeight - source.clientHeight;
    if (sourceMax <= 0) return;

    const targetMax = target.scrollHeight - target.clientHeight;
    target.scrollTop = (source.scrollTop / sourceMax) * targetMax;
  }, []);

  return {
    sourceRef,
    targetRef,
    textareaRef: sourceRef,
    previewRef: targetRef,
    handleScroll: syncScroll,
    syncScroll,
  };
}
