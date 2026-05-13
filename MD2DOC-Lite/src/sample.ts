const BT = '`';

export const sample = `---
title: "MD2DOC Lite Guide"
author: "MD2DOC Lite"
subject: "Lightweight Markdown to DOCX sample"
keywords: markdown, docx, lite
header: true
footer: true
---
# MD2DOC Lite

[TOC]

## Inline styles

MD2DOC Lite supports **bold**, *italic*, <u>underline</u>, ${BT}inline code${BT}, and keyboard keys like [Ctrl] + [S].

> [!TIP]
> Use frontmatter to set the Word title, author, subject, keywords, header, and footer.

## Lists

- First point
  - Nested point
    - Third level point
- Point with **bold** text

1. Ordered item
   1. Nested ordered item
2. Another ordered item

---

## Tables

| Feature | Lite support | Export |
| --- | :---: | --- |
| Headings H1-H3 | yes | Word headings |
| Tables | yes | DOCX tables |
| Images | base64 or URL text fallback | safe fallback |

## Chat

System :": Center aligned system note.

Gemini ":: Left aligned reply.

Reader ::" Right aligned reply.

## Code

${BT}${BT}${BT}ts:ln
const message = 'hello lite';
console.log(message);
${BT}${BT}${BT}

${BT}${BT}${BT}json:no-ln
{
  "name": "md2doc-lite",
  "lightweight": true
}
${BT}${BT}${BT}

## Callouts and images

> [!NOTE]
> URL images are kept as readable references when DOCX embedding is not available.

> [!WARNING]
> Mermaid code fences stay as plain code in Lite. No Mermaid package is bundled.

![Remote image](https://example.com/image.png "Image title")
`;
