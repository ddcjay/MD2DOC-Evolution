export async function saveBlob(blob: Blob, fileName: string) {
  if (isTauriRuntime()) {
    const { invoke } = await import('@tauri-apps/api/core');
    const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
    await invoke('save_file', { fileName, bytes });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface SavedMarkdownFile {
  fileName: string;
  filePath: string | null;
}

export async function saveMarkdownContent(content: string, fileName: string, sourceFilePath?: string | null) {
  if (isTauriRuntime()) {
    const { invoke } = await import('@tauri-apps/api/core');

    if (sourceFilePath) {
      return await invoke<SavedMarkdownFile>('write_markdown_file', {
        path: sourceFilePath,
        content,
      });
    }

    return await invoke<SavedMarkdownFile | null>('save_markdown_file', {
      fileName,
      content,
    });
  }

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  await saveBlob(blob, fileName);
  return { fileName, filePath: null };
}

function isTauriRuntime() {
  return '__TAURI_INTERNALS__' in window;
}
