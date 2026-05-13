export interface TextSelection {
  start: number;
  end: number;
}

export interface InsertTextResult {
  value: string;
  cursor: number;
}

export function insertMarkdownAtSelection(value: string, insertText: string, selection: TextSelection): InsertTextResult {
  const before = value.slice(0, selection.start);
  const after = value.slice(selection.end);
  const prefix = before && !before.endsWith('\n') ? '\n' : '';
  const next = `${before}${prefix}${insertText}${after}`;

  return {
    value: next,
    cursor: before.length + prefix.length + insertText.length,
  };
}
