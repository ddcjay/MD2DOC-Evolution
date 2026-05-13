const CJK_RE = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/;
const CJK_GLOBAL_RE = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g;

export function stripMarkdownSyntax(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*#>`~_[\](){}|\\-]/g, ' ');
}

export function countMarkdownWords(text: string): number {
  if (!text) return 0;

  const cleanText = stripMarkdownSyntax(text);
  const cjk = cleanText.match(CJK_GLOBAL_RE)?.length ?? 0;
  const latin = cleanText.replace(CJK_GLOBAL_RE, ' ').match(/\b[\p{L}\p{N}_]+\b/gu)?.length ?? 0;

  return cjk + latin;
}

export function cleanTextForPublishing(text: string): string {
  if (!text || text.length < 2 || /^https?:\/\//i.test(text)) return text;

  let result = text
    .replace(/([\u4e00-\u9fff])\s+([a-zA-Z0-9])/g, '$1$2')
    .replace(/([a-zA-Z0-9])\s+([\u4e00-\u9fff])/g, '$1$2');

  if (!CJK_RE.test(result)) return result;

  result = result
    .replace(/([^0-9]),\s*/g, (match, before: string) => (/[\u4e00-\u9fffa-zA-Z]/.test(before) ? `${before}，` : match))
    .replace(/([\u4e00-\u9fff]);\s*/g, '$1；')
    .replace(/([\u4e00-\u9fff])!\s*/g, '$1！')
    .replace(/([\u4e00-\u9fff])\?\s*/g, '$1？')
    .replace(/([\u4e00-\u9fff]):\s*/g, '$1：');

  return result;
}
