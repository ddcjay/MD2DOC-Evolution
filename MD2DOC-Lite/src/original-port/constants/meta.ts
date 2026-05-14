export type PageSizeKey = 'a4' | 'a5' | 'b5';

export interface PageSize {
  key: PageSizeKey;
  name: PageSizeKey;
  label: string;
  width: number;
  height: number;
  widthCm: number;
  heightCm: number;
}

export const APP_META = {
  name: 'MD2DOC Lite',
  sourceName: 'MD2DOC Evolution',
  githubUrl: 'https://github.com/eric861129/MD2DOC-Evolution',
} as const;

export const PAGE_SIZES: PageSize[] = [
  { key: 'a4', name: 'a4', label: 'A4', width: 21, height: 29.7, widthCm: 21, heightCm: 29.7 },
  { key: 'a5', name: 'a5', label: 'A5', width: 14.8, height: 21, widthCm: 14.8, heightCm: 21 },
  { key: 'b5', name: 'b5', label: 'B5', width: 17.6, height: 25, widthCm: 17.6, heightCm: 25 },
];

export const PAGE_SIZE_RECORD: Record<PageSizeKey, PageSize> = PAGE_SIZES.reduce(
  (record, size) => ({ ...record, [size.key]: size }),
  {} as Record<PageSizeKey, PageSize>,
);

export function getPageSize(key: PageSizeKey, fallback: PageSizeKey = 'a4'): PageSize {
  return PAGE_SIZE_RECORD[key] ?? PAGE_SIZE_RECORD[fallback];
}
