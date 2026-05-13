import type { ReactNode } from 'react';
import { parseInline } from './markdown';
import type { InlineSegment, MarkdownBlock } from './types';

type PageSizeKey = 'tech' | 'a4' | 'a5' | 'b5';

type PreviewProps = {
  blocks: MarkdownBlock[];
  pageSize: PageSizeKey;
};

export function Preview({ blocks, pageSize }: PreviewProps) {
  const headings = blocks.filter(
    (block): block is Extract<MarkdownBlock, { type: 'heading' }> => block.type === 'heading',
  );

  return (
    <article className={`paper paper--${pageSize}`}>
      {blocks.map((block, index) => renderBlock(block, index, headings))}
    </article>
  );
}

function renderBlock(
  block: MarkdownBlock,
  index: number,
  headings: Extract<MarkdownBlock, { type: 'heading' }>[],
): ReactNode {
  switch (block.type) {
    case 'heading':
      if (block.level === 1) return <h1 key={index}>{renderInline(block.text)}</h1>;
      if (block.level === 2) return <h2 key={index}>{renderInline(block.text)}</h2>;
      return <h3 key={index}>{renderInline(block.text)}</h3>;
    case 'paragraph':
      return <p key={index}>{renderInline(block.text)}</p>;
    case 'quote':
      return <blockquote key={index}>{renderInlineMultiline(block.text)}</blockquote>;
    case 'callout':
      return (
        <aside key={index} className={`callout callout-${block.kind.toLowerCase()}`}>
          <strong>{block.kind}</strong>
          <p>{renderInlineMultiline(block.text)}</p>
        </aside>
      );
    case 'chat':
      return (
        <section key={index} className={`chat-bubble chat-${block.alignment}`}>
          <strong>{block.role}</strong>
          <p>{renderInlineMultiline(block.text)}</p>
        </section>
      );
    case 'code':
      return (
        <pre key={index} data-language={block.language || 'text'} data-lines={block.showLineNumbers ? 'true' : 'false'}>
          <code>
            {block.showLineNumbers
              ? block.text.split('\n').map((line, lineIndex) => (
                  <span key={lineIndex} className="code-line">
                    <span className="line-no">{lineIndex + 1}</span>
                    <span>{line || ' '}</span>
                  </span>
                ))
              : block.text}
          </code>
        </pre>
      );
    case 'list':
      return renderList(block, index);
    case 'ul':
      return (
        <ul key={index}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={index}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <table key={index}>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{renderInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'hr':
      return <hr key={index} />;
    case 'toc':
      return (
        <nav key={index} className="toc" aria-label="Table of contents">
          <strong>目錄</strong>
          <ol>
            {headings.map((heading, headingIndex) => (
              <li key={`${heading.text}-${headingIndex}`} className={`toc-level-${heading.level}`}>
                {heading.text}
              </li>
            ))}
          </ol>
        </nav>
      );
    case 'image':
      return (
        <figure key={index} className="image-block">
          {block.src.startsWith('data:image/') || /^https?:\/\//.test(block.src) ? (
            <img src={block.src} alt={block.alt} />
          ) : (
            <div className="image-placeholder">{block.src}</div>
          )}
          {block.alt ? <figcaption>{block.alt}</figcaption> : null}
        </figure>
      );
    default:
      return null;
  }
}

function renderList(block: Extract<MarkdownBlock, { type: 'list' }>, index: number) {
  const Tag = block.ordered ? 'ol' : 'ul';

  return (
    <Tag key={index}>
      {block.items.map((item, itemIndex) => (
        <li key={itemIndex} style={{ marginLeft: `${item.level * 18}px` }}>
          {renderInline(item.text)}
        </li>
      ))}
    </Tag>
  );
}

function renderInlineMultiline(text: string): ReactNode[] {
  return text.split('\n').flatMap((line, index) => {
    const content = renderInline(line);
    return index === 0 ? content : [<br key={`br-${index}`} />, ...content];
  });
}

function renderInline(text: string): ReactNode[] {
  return parseInline(text).map((segment, index) => renderSegment(segment, index));
}

function renderSegment(segment: InlineSegment, index: number): ReactNode {
  switch (segment.type) {
    case 'bold':
      return <strong key={index}>{segment.text}</strong>;
    case 'italic':
      return <em key={index}>{segment.text}</em>;
    case 'underline':
      return <u key={index}>{segment.text}</u>;
    case 'code':
      return <code key={index}>{segment.text}</code>;
    case 'kbd':
      return <kbd key={index}>{segment.text}</kbd>;
    case 'link':
      return (
        <a key={index} href={segment.href} target="_blank" rel="noreferrer">
          {segment.text}
        </a>
      );
    case 'image':
      return segment.href ? <img key={index} className="inline-image" src={segment.href} alt={segment.alt || segment.text} /> : segment.text;
    default:
      return segment.text;
  }
}
