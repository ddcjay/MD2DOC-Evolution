const BT = "`";

export type VerificationMode = "automatic" | "manual" | "hybrid";

export type VerificationArea =
  | "parser"
  | "preview"
  | "docx"
  | "editor"
  | "runtime";

export type VerificationPriority = "p0" | "p1" | "p2";

export interface FeatureParityCheck {
  id: string;
  area: VerificationArea;
  priority: VerificationPriority;
  mode: VerificationMode;
  sourceRefs: string[];
  feature: string;
  originalBehavior: string;
  automaticCheck?: string;
  manualCheck?: string;
  sampleCoverage?: string[];
}

export interface ExpectedSampleParse {
  meta: Record<string, string | boolean>;
  blockTypes: string[];
  codeBlocks: Array<{
    language: string;
    showLineNumbers?: boolean;
  }>;
  chatAlignments: Array<"left" | "right" | "center">;
  calloutTypes: Array<"CALLOUT_TIP" | "CALLOUT_NOTE" | "CALLOUT_WARNING">;
}

export const ORIGINAL_PORT_SAMPLE_MARKDOWN = `---
title: "Original Port Parity Sample"
author: "MD2DOC Evolution"
subject: "Feature parity fixture for Markdown preview and DOCX export"
keywords: markdown, docx, mermaid, callout, qr
header: true
footer: true
---
# Original Port Parity Sample

[TOC]
- Document Structure
- Rich Blocks
- Export Coverage

## Document Structure

This paragraph covers **bold**, *italic*, <u>underline</u>, ${BT}inline code${BT}, keyboard shortcuts like [Ctrl] + [S], a printable QR link to [MD2DOC Evolution](https://huangchiyu.com/MD2DOC-Evolution/), and a remote inline image ![small badge](https://example.com/badge.png).

### Lists

- Bullet level 1
  - Bullet level 2
    - Bullet level 3
- Checklist item is parsed as list text
  - [ ] Confirm unchecked marker cleanup
  - [x] Confirm checked marker cleanup

1. Numbered level 1
   1. Numbered level 2
2. Numbered item with **inline style**

---

## Rich Blocks

> [!TIP]
> Tips render as solid bordered callouts and export as styled DOCX blocks.

> [!NOTE]
> Notes render with a lighter dashed style and keep inline [Ctrl] key tokens.

> [!WARNING]
> Warnings render with stronger emphasis in preview and DOCX.

User ":: This left-aligned dialogue should appear as a user style bubble.
AI ::" This right-aligned dialogue should appear as an AI style bubble.
System :": This centered dialogue should appear as a system style bubble.

${BT}${BT}${BT}ts:ln
export function greet(name: string) {
  return \`Hello, \${name}\`;
}
${BT}${BT}${BT}

${BT}${BT}${BT}json:no-ln
{
  "lineNumbers": false,
  "target": "configuration"
}
${BT}${BT}${BT}

${BT}${BT}${BT}mermaid
graph TD;
  A[Markdown] --> B[Preview];
  B --> C[DOCX];
${BT}${BT}${BT}

| Feature | Preview expectation | DOCX expectation |
| --- | --- | --- |
| TOC | Manual dotted list | Word TOC/manual list block |
| Link | Anchor plus QR marker | Link text plus QR image |
| Table | Bordered table | Bordered Word table |

![Architecture image](https://example.com/architecture.png "Architecture")

## Export Coverage

The exported file should use the frontmatter title in document properties, show the title in the header, show centered page numbers in the footer, and preserve the selected page size.
`;

export const EXPECTED_SAMPLE_PARSE: ExpectedSampleParse = {
  meta: {
    title: "Original Port Parity Sample",
    author: "MD2DOC Evolution",
    subject: "Feature parity fixture for Markdown preview and DOCX export",
    keywords: "markdown, docx, mermaid, callout, qr",
    header: true,
    footer: true,
  },
  blockTypes: [
    "HEADING_1",
    "TOC",
    "HEADING_2",
    "PARAGRAPH",
    "HEADING_3",
    "BULLET_LIST",
    "NUMBERED_LIST",
    "HORIZONTAL_RULE",
    "HEADING_2",
    "CALLOUT_TIP",
    "CALLOUT_NOTE",
    "CALLOUT_WARNING",
    "CHAT_CUSTOM",
    "CODE_BLOCK",
    "MERMAID",
    "TABLE",
    "IMAGE",
  ],
  codeBlocks: [
    { language: "ts", showLineNumbers: true },
    { language: "json", showLineNumbers: false },
  ],
  chatAlignments: ["left", "right", "center"],
  calloutTypes: ["CALLOUT_TIP", "CALLOUT_NOTE", "CALLOUT_WARNING"],
};

export const FEATURE_PARITY_CHECKS: FeatureParityCheck[] = [
  {
    id: "parser-frontmatter-meta",
    area: "parser",
    priority: "p0",
    mode: "automatic",
    sourceRefs: ["README_EN.md: YAML Frontmatter Support", "services/markdownParser.ts"],
    feature: "YAML frontmatter extraction",
    originalBehavior: "The first YAML block is removed from body content and exposed as document metadata.",
    automaticCheck: "Parse ORIGINAL_PORT_SAMPLE_MARKDOWN and assert title, author, subject, keywords, header, and footer metadata.",
    sampleCoverage: ["frontmatter"],
  },
  {
    id: "parser-heading-depths",
    area: "parser",
    priority: "p0",
    mode: "automatic",
    sourceRefs: ["README_EN.md: Support Matrix", "services/parser/ast.ts"],
    feature: "Heading parsing",
    originalBehavior: "H1, H2, and H3 map to dedicated block types; deeper headings are not primary supported syntax.",
    automaticCheck: "Assert #, ##, and ### become HEADING_1, HEADING_2, and HEADING_3.",
    sampleCoverage: ["# heading", "## heading", "### heading"],
  },
  {
    id: "parser-toc",
    area: "parser",
    priority: "p0",
    mode: "automatic",
    sourceRefs: ["README_EN.md: Automatic TOC", "services/parser/ast.ts", "services/docx/builders/toc.ts"],
    feature: "TOC marker and manual TOC lines",
    originalBehavior: "[TOC] becomes a TOC block; following list items can be merged into the TOC content.",
    automaticCheck: "Assert [TOC] plus adjacent list lines produces one TOC block with manual TOC content.",
    sampleCoverage: ["[TOC]", "manual TOC list"],
  },
  {
    id: "parser-code-modifiers",
    area: "parser",
    priority: "p0",
    mode: "automatic",
    sourceRefs: ["README_EN.md: Enhanced Code Blocks", "services/parser/ast.ts", "services/docx/builders/codeBlock.ts"],
    feature: "Code block language and line-number modifiers",
    originalBehavior: "Code fences keep language labels and support :ln and :no-ln modifiers.",
    automaticCheck: "Assert ts:ln sets language ts and showLineNumbers true; json:no-ln sets language json and showLineNumbers false.",
    sampleCoverage: ["ts:ln fence", "json:no-ln fence"],
  },
  {
    id: "parser-mermaid",
    area: "parser",
    priority: "p0",
    mode: "automatic",
    sourceRefs: ["README_EN.md: Mermaid Chart Support", "components/editor/MermaidRenderer.tsx", "services/docx/builders/mermaid.ts"],
    feature: "Mermaid blocks",
    originalBehavior: "A mermaid fence becomes a MERMAID block for live SVG preview and DOCX image conversion.",
    automaticCheck: "Assert mermaid fenced code becomes MERMAID, not CODE_BLOCK.",
    manualCheck: "Preview renders the chart; DOCX opens with the chart image after Word recovery if prompted.",
    sampleCoverage: ["mermaid fence"],
  },
  {
    id: "parser-callouts",
    area: "parser",
    priority: "p0",
    mode: "automatic",
    sourceRefs: ["README_EN.md: Rich Callouts", "services/parser/ast.ts", "services/docx/builders/callout.ts"],
    feature: "GitHub/Obsidian callouts",
    originalBehavior: "> [!TIP], > [!NOTE], and > [!WARNING] map to three distinct callout blocks.",
    automaticCheck: "Assert the sample contains CALLOUT_TIP, CALLOUT_NOTE, and CALLOUT_WARNING.",
    sampleCoverage: ["TIP callout", "NOTE callout", "WARNING callout"],
  },
  {
    id: "parser-chat-dialogues",
    area: "parser",
    priority: "p0",
    mode: "automatic",
    sourceRefs: ["README_EN.md: Chat Dialogues", "services/parser/ast.ts", "services/docx/builders/chat.ts"],
    feature: "Chat dialogue syntax",
    originalBehavior: "Role markers map to CHAT_CUSTOM blocks with left, right, or center alignment.",
    automaticCheck: "Assert User \":: is left aligned, AI ::\" is right aligned, and System :\": is center aligned.",
    sampleCoverage: ["left chat", "right chat", "center chat"],
  },
  {
    id: "parser-list-table-hr-image",
    area: "parser",
    priority: "p0",
    mode: "automatic",
    sourceRefs: ["README_EN.md: Rich Block Support", "services/parser/ast.ts"],
    feature: "Common Markdown blocks",
    originalBehavior: "Bullets, ordered lists, nested levels, tables, horizontal rules, and images become dedicated blocks.",
    automaticCheck: "Assert list nestingLevel values, TABLE rows, HORIZONTAL_RULE, and IMAGE metadata are present.",
    sampleCoverage: ["nested lists", "table", "hr", "image"],
  },
  {
    id: "preview-inline-rendering",
    area: "preview",
    priority: "p1",
    mode: "manual",
    sourceRefs: ["README_EN.md: Special Inline Styles", "components/editor/PreviewRenderers.tsx", "utils/styleParser.ts"],
    feature: "Inline rich text preview",
    originalBehavior: "Bold, italic, underline, inline code, links with QR marker, images, shortcuts, UI tokens, and book-title tokens render with special styles.",
    manualCheck: "Paste the sample and visually confirm inline styles, link QR marker, shortcut key styling, and inline image rendering.",
    sampleCoverage: ["bold", "italic", "underline", "inline code", "shortcut", "link", "inline image"],
  },
  {
    id: "preview-block-rendering",
    area: "preview",
    priority: "p1",
    mode: "manual",
    sourceRefs: ["README_EN.md: WYSIWYG Editor", "components/editor/PreviewPane.tsx", "components/editor/PreviewRenderers.tsx"],
    feature: "Block preview rendering",
    originalBehavior: "The right pane renders headings, TOC, code labels, callouts, chat bubbles, tables, images, and horizontal rules.",
    manualCheck: "Paste the sample and compare the preview against the original visual conventions for each block type.",
    sampleCoverage: ["all major preview blocks"],
  },
  {
    id: "docx-metadata-layout",
    area: "docx",
    priority: "p0",
    mode: "hybrid",
    sourceRefs: ["README_EN.md: Professional Word Export", "README_EN.md: Dynamic Headers & Footers", "services/docxGenerator.ts"],
    feature: "DOCX metadata, page size, header, and footer",
    originalBehavior: "Frontmatter title/author/subject become document properties; title header and centered page-number footer are enabled unless disabled.",
    automaticCheck: "Generate DOCX from the sample and inspect document properties and section dimensions when a DOCX inspection test exists.",
    manualCheck: "Open the DOCX in Word and confirm title header, centered page number, and selected page size.",
    sampleCoverage: ["frontmatter", "header", "footer"],
  },
  {
    id: "docx-rich-blocks",
    area: "docx",
    priority: "p0",
    mode: "hybrid",
    sourceRefs: ["services/docx/builders/index.ts", "services/docx/builders/table.ts", "services/docx/builders/codeBlock.ts", "services/docx/builders/callout.ts"],
    feature: "DOCX rich block export",
    originalBehavior: "Registered builders export headings, paragraphs, code blocks, Mermaid, images, chat, callouts, lists, tables, TOC, and horizontal rules.",
    automaticCheck: "Generate DOCX and assert the output blob is non-empty; unzip and inspect document.xml for expected text when available.",
    manualCheck: "Open exported DOCX and verify visible formatting for code labels, callouts, chat bubbles, tables, lists, images, and TOC.",
    sampleCoverage: ["all major DOCX builders"],
  },
  {
    id: "docx-qr-links",
    area: "docx",
    priority: "p1",
    mode: "manual",
    sourceRefs: ["README_EN.md: Smart Links (QR Code)", "services/qrCodeService.ts", "services/docx/builders/common.ts"],
    feature: "Smart links and QR generation",
    originalBehavior: "Markdown links generate QR code images next to link text in DOCX output.",
    manualCheck: "Export the sample and scan or visually confirm the QR image near the MD2DOC Evolution link.",
    sampleCoverage: ["markdown link"],
  },
  {
    id: "editor-core-workflow",
    area: "editor",
    priority: "p1",
    mode: "manual",
    sourceRefs: ["README_EN.md: WYSIWYG Editor", "components/MarkdownEditor.tsx", "components/editor/EditorPane.tsx", "hooks/useMarkdownEditor.ts"],
    feature: "Editor workflow",
    originalBehavior: "The editor has a two-pane layout, resizable divider, synchronized scrolling, word count, Tab indentation, draft persistence, and reset.",
    manualCheck: "Paste the sample, resize panes, scroll both panes, press Tab in the editor, refresh, and confirm draft persistence/reset behavior.",
    sampleCoverage: ["large multi-section document"],
  },
  {
    id: "editor-import-images",
    area: "editor",
    priority: "p1",
    mode: "manual",
    sourceRefs: ["README_EN.md: Quick Import", "components/editor/EditorPane.tsx"],
    feature: "Drag-and-drop import",
    originalBehavior: "Dropping an .md file replaces editor content; dropping images registers base64 images and inserts image markdown IDs.",
    manualCheck: "Drop a markdown file, then drop a PNG/JPG and confirm an image markdown reference is inserted and rendered.",
  },
  {
    id: "editor-slash-quick-actions",
    area: "editor",
    priority: "p2",
    mode: "manual",
    sourceRefs: ["README_EN.md: Slash Commands", "components/editor/slash-command/commands.ts", "components/editor/QuickActionSidebar.tsx"],
    feature: "Slash commands and quick action sidebar",
    originalBehavior: "Slash menu and sidebar insert common templates for headings, lists, TOC, callouts, code, Mermaid, tables, chat, and images.",
    manualCheck: "Type / and use the sidebar buttons to insert each supported template without losing focus or cursor position.",
  },
  {
    id: "runtime-theme-language-export",
    area: "runtime",
    priority: "p2",
    mode: "manual",
    sourceRefs: ["components/editor/EditorHeader.tsx", "services/i18n.ts", "hooks/useDarkMode.ts", "hooks/useDocxExport.ts"],
    feature: "Header controls",
    originalBehavior: "Header controls switch theme/language, open the AI prompt, export markdown, and export DOCX with selected size.",
    manualCheck: "Exercise header buttons and confirm dark mode, language reset prompt, AI prompt copy, markdown export filename, and DOCX export filename.",
  },
];

export const AUTOMATIC_FEATURE_PARITY_CHECKS = FEATURE_PARITY_CHECKS.filter(
  (check) => check.mode === "automatic" || check.mode === "hybrid",
);

export const MANUAL_FEATURE_PARITY_CHECKS = FEATURE_PARITY_CHECKS.filter(
  (check) => check.mode === "manual" || check.mode === "hybrid",
);
