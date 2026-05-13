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

function isTauriRuntime() {
  return '__TAURI_INTERNALS__' in window;
}
