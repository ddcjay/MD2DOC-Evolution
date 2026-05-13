export function safeFileName(value: unknown, fallback = ''): string {
  const fileName = value ? String(value).replace(/[\\/:*?"<>|]/g, '').trim() : '';
  return fileName || fallback;
}

export function markdownAlt(text: string): string {
  return text.replace(/[[\]\\]/g, '').trim();
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function fileToMarkdownImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(`![${markdownAlt(file.name || 'image')}](${String(reader.result)})`);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function filesToMarkdownImages(files: FileList | File[]): Promise<string[]> {
  return Promise.all(Array.from(files).filter(isImageFile).map(fileToMarkdownImage));
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
