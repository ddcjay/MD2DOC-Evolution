export const LINE_HEIGHT = {
  SINGLE: 240,
  ONE_POINT_TWO: 276,
  ONE_POINT_FIVE: 360,
  DOUBLE: 480,
} as const;

export const TWIPS_PER_INCH = 1440;
export const TWIPS_PER_CM = 567;
export const TWIPS_PER_PT = 20;

export const WORD_THEME = {
  FONTS: {
    CJK: 'Microsoft JhengHei',
    LATIN: 'Aptos',
    MONO: 'Consolas',
  },
  FONT_SIZES: {
    BODY: 22,
    CODE: 18,
    LABEL: 18,
    SHORTCUT: 20,
    H1: 32,
    H2: 28,
    H3: 24,
  },
  COLORS: {
    BLACK: '000000',
    WHITE: 'FFFFFF',
    TEXT: '111827',
    MUTED: '64748B',
    BORDER: 'CBD5E1',
    PRIMARY_BLUE: '1E3A8A',
    LINK_BLUE: '2563EB',
    BG_CODE: 'F1F5F9',
    BG_BUTTON: 'E2E8F0',
    BG_SHORTCUT: 'F8FAFC',
    BG_AI_CHAT: 'F2F2F2',
    CALLOUT: {
      TIP: { BORDER: '10B981', BG: 'ECFDF5' },
      NOTE: { BORDER: '3B82F6', BG: 'EFF6FF' },
      WARNING: { BORDER: 'F97316', BG: 'FFF7ED' },
    },
    CHAT_BORDER: 'CBD5E1',
    CODE_BORDER: 'CBD5E1',
    LINE_NUMBER_TEXT: '94A3B8',
  },
  SPACING: {
    PARAGRAPH: { before: 200, after: 200 },
    H1: { before: 480, after: 240 },
    H2: { before: 400, after: 200 },
    H3: { before: 300, after: 150 },
    CODE_BLOCK: { before: 600, after: 600, line: LINE_HEIGHT.SINGLE },
    CHAT: { before: 400, after: 400, line: LINE_HEIGHT.ONE_POINT_TWO },
    CALLOUT: { before: 600, after: 600, line: LINE_HEIGHT.ONE_POINT_FIVE },
    LIST: { before: 120, after: 120 },
    TABLE_AFTER: 240,
    HR: { before: 240, after: 240 },
  },
  LAYOUT: {
    WIDTH: {
      LINE_NUMBER: 450,
    },
    INDENT: {
      CODE: 400,
      CHAT: TWIPS_PER_INCH,
      CALLOUT: 400,
    },
    BORDER: {
      H1_BOTTOM: 18,
      CODE: 6,
      CALLOUT_TIP: 36,
      CALLOUT_WARNING: 48,
      CALLOUT_NOTE: 24,
      HR: 12,
    },
    MARGIN: {
      NORMAL: TWIPS_PER_INCH,
    },
  },
} as const;

export const UI_THEME = {
  FONTS: {
    PREVIEW: `"${WORD_THEME.FONTS.LATIN}", "${WORD_THEME.FONTS.CJK}", sans-serif`,
    MONO: `"${WORD_THEME.FONTS.MONO}", "SFMono-Regular", monospace`,
  },
} as const;

export const SIZES = {
  CM_TO_TWIPS: TWIPS_PER_CM,
  PT_TO_TWIPS: TWIPS_PER_PT,
} as const;
