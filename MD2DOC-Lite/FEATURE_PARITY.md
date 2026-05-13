# Original Feature Parity

This document tracks the original MD2DOC-Evolution behavior that MD2DOC-Lite should preserve while porting features. It is based on the original `README_EN.md`, `components`, `hooks`, `utils`, and `services` folders. The executable checklist and shared fixture live in `src/original-port/featureParity.ts`.

Scope guard: do not wire this into the UI entry point from this task. These notes are for verification and migration planning only.

## Shared Fixture

Use `ORIGINAL_PORT_SAMPLE_MARKDOWN` from `src/original-port/featureParity.ts` as the primary fixture. It covers:

- YAML frontmatter: title, author, subject, keywords, header, footer.
- Document structure: H1, H2, H3, `[TOC]`, manual TOC entries, horizontal rule.
- Inline styles: bold, italic, underline, inline code, shortcut keys, link, inline image.
- Rich blocks: nested bullets, ordered lists, table, image block.
- Technical blocks: `ts:ln`, `json:no-ln`, and `mermaid` fences.
- Publishing blocks: TIP, NOTE, WARNING callouts and left/right/center chat dialogues.
- DOCX concerns: document properties, header/footer, page size, QR link, Mermaid/image export.

## Automatic Checks

| ID | Area | Priority | Expected original behavior |
| --- | --- | --- | --- |
| `parser-frontmatter-meta` | parser | P0 | Frontmatter is removed from body content and exposed as metadata. |
| `parser-heading-depths` | parser | P0 | `#`, `##`, and `###` map to H1, H2, and H3 block types. |
| `parser-toc` | parser | P0 | `[TOC]` creates a TOC block and can absorb adjacent manual list entries. |
| `parser-code-modifiers` | parser | P0 | Code fences preserve language labels and `:ln` / `:no-ln` settings. |
| `parser-mermaid` | parser | P0 | A `mermaid` fence creates a Mermaid block rather than a generic code block. |
| `parser-callouts` | parser | P0 | `[!TIP]`, `[!NOTE]`, and `[!WARNING]` become distinct callout block types. |
| `parser-chat-dialogues` | parser | P0 | `Role "::`, `Role ::"`, and `Role :":` become left, right, and center chat blocks. |
| `parser-list-table-hr-image` | parser | P0 | Lists, nested list levels, tables, horizontal rules, and images produce dedicated blocks. |
| `docx-metadata-layout` | docx | P0 | DOCX metadata, selected page size, title header, and centered page-number footer match frontmatter/config. |
| `docx-rich-blocks` | docx | P0 | Registered DOCX builders output all major rich block types. |

Suggested automated test shape:

1. Parse `ORIGINAL_PORT_SAMPLE_MARKDOWN`.
2. Assert metadata equals `EXPECTED_SAMPLE_PARSE.meta`.
3. Assert required block types are present, not necessarily in a brittle exact full sequence.
4. Assert code block metadata for `ts:ln` and `json:no-ln`.
5. Assert chat alignments include left, right, and center.
6. Assert all three callout block types are present.
7. Generate DOCX from parsed blocks and assert a non-empty Blob. Add XML inspection later when a DOCX unzip helper is available.

## Manual Checks

| ID | Area | Priority | What to verify |
| --- | --- | --- | --- |
| `preview-inline-rendering` | preview | P1 | Inline rich text styles render correctly, including link QR marker, shortcut keys, and inline image. |
| `preview-block-rendering` | preview | P1 | Preview renders headings, TOC, code labels, callouts, chat bubbles, tables, images, and horizontal rules. |
| `docx-metadata-layout` | docx | P0 | Open exported DOCX and confirm title header, centered page number, document properties, and selected page size. |
| `docx-rich-blocks` | docx | P0 | Open exported DOCX and inspect code blocks, callouts, chat bubbles, table borders, lists, TOC, images, and Mermaid chart. |
| `docx-qr-links` | docx | P1 | Confirm the markdown link exports with a QR image that can be scanned or visually recognized. |
| `editor-core-workflow` | editor | P1 | Confirm two-pane editing, divider resize, synchronized scroll, word count, Tab indentation, draft persistence, and reset. |
| `editor-import-images` | editor | P1 | Drop an `.md` file to replace content; drop image files to insert registered image markdown IDs and preview them. |
| `editor-slash-quick-actions` | editor | P2 | Type `/` and use sidebar buttons to insert headings, lists, TOC, callouts, code, Mermaid, tables, chat, and image templates. |
| `runtime-theme-language-export` | runtime | P2 | Confirm theme toggle, language reset prompt, AI prompt copy, markdown export, DOCX export, and selected size control. |

## Source Feature Map

| Feature group | Original sources | Notes |
| --- | --- | --- |
| Parser and block model | `services/markdownParser.ts`, `services/parser/ast.ts`, `services/types.ts` | Core source for automatic parity checks. |
| Preview rendering | `components/editor/PreviewRenderers.tsx`, `components/editor/PreviewPane.tsx`, `components/editor/MermaidRenderer.tsx` | Requires visual/manual review for layout and styling. |
| DOCX export | `services/docxGenerator.ts`, `services/docx/builders/*`, `services/qrCodeService.ts` | Needs both blob-generation checks and Word/manual inspection. |
| Editor behavior | `components/MarkdownEditor.tsx`, `components/editor/EditorPane.tsx`, `components/editor/QuickActionSidebar.tsx`, `hooks/useMarkdownEditor.ts` | Covers two-pane layout, resize, scroll sync, slash commands, drag/drop, persistence. |
| Header/runtime controls | `components/editor/EditorHeader.tsx`, `components/AIPromptModal.tsx`, `hooks/useDarkMode.ts`, `services/i18n.ts` | Mostly manual because it is interaction-oriented. |

## Porting Notes

- Keep parser parity tests tolerant to extra blocks. The important assertion is that every required feature block appears with the expected metadata.
- Keep DOCX checks split into automated smoke tests and manual Word inspection. Mermaid export can trigger Word's recovery prompt in the original app; that behavior is documented as a known issue.
- Treat QR generation as publishing behavior, not just preview behavior. Preview may show a QR icon, but DOCX should contain an actual QR image.
- Keep UI entry points unchanged until the Lite port explicitly decides which original workflows are enabled.
