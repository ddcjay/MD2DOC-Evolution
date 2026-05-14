/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

import React from 'react';
import { UI_THEME } from '../../constants/theme';
import { useEditor } from '../../contexts/EditorContext';
import { useSlashCommand } from '../../hooks/editor/useSlashCommand';
import { SlashCommandMenu } from './slash-command/SlashCommandMenu';

interface EditorPaneProps {
  content: string;
  setContent: (content: string) => void;
  wordCount: number;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onScroll: () => void;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  content,
  setContent,
  wordCount,
  textareaRef,
  onScroll
}) => {
  const { registerImage, openMarkdownFile, loadMarkdownContent, sourceFileName } = useEditor();
  
  const {
    isOpen,
    position,
    filteredCommands,
    selectedIndex,
    handleKeyDown: handleSlashKeyDown,
    handleChange: handleSlashChange,
    insertCommand,
    closeMenu
  } = useSlashCommand({ content, setContent, textareaRef });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Give priority to Slash Command
    handleSlashKeyDown(e);
    if (e.defaultPrevented) return;

    // 2. Existing Tab handling
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // 在當前位置插入兩個空格
      const newContent = content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);

      // 重新設定光標位置
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // 1. Update Slash Command State
    handleSlashChange(e);
    
    // 2. Update Content
    setContent(e.target.value);
  };

  React.useEffect(() => {
    if (!('__TAURI_INTERNALS__' in window)) return;

    let disposed = false;
    let unlisten: (() => void) | undefined;

    const listenForDroppedMarkdown = async () => {
      try {
        const [{ getCurrentWebview }, { invoke }] = await Promise.all([
          import('@tauri-apps/api/webview'),
          import('@tauri-apps/api/core')
        ]);

        unlisten = await getCurrentWebview().onDragDropEvent(async (event) => {
          if (event.payload.type !== 'drop') return;

          const paths = 'paths' in event.payload ? event.payload.paths : [];
          const mdPath = paths.find(isMarkdownPath);
          if (!mdPath) return;

          try {
            const document = await invoke<{ fileName: string; content: string }>('read_markdown_file', { path: mdPath });
            if (!disposed) {
              loadMarkdownContent(document.fileName, document.content, mdPath);
            }
          } catch (error) {
            console.error('Unable to open dropped Markdown file:', error);
          }
        });
      } catch (error) {
        console.error('Unable to register native file drop handler:', error);
      }
    };

    listenForDroppedMarkdown();

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [loadMarkdownContent]);

  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    
    // 1. Handle Markdown files (.md)
    const mdFile = files.find(file => 
      file.name.toLowerCase().endsWith('.md') || 
      file.type === 'text/markdown' || 
      file.type === 'text/x-markdown'
    );

    if (mdFile) {
      await openMarkdownFile(mdFile);
      return;
    }

    // 2. Handle Image files (existing logic)
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    const target = textareaRef.current;
    const start = target?.selectionStart ?? content.length;
    const end = target?.selectionEnd ?? content.length;

    let insertedText = '';
    
    for (const file of imageFiles) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Generate a short ID for the image
      const imageId = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      registerImage(imageId, base64);
      
      insertedText += `\n![${file.name}](${imageId})\n`;
    }

    const newContent = content.substring(0, start) + insertedText + content.substring(end);
    setContent(newContent);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div
      className="w-full h-full flex flex-col bg-white dark:bg-slate-900 transition-colors relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {sourceFileName ? `Editing ${sourceFileName}` : 'Manuscript Editor (Draft)'}
        </span>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
           {wordCount} Words
        </span>
      </div>
      <textarea
        ref={textareaRef}
        onScroll={onScroll}
                  className="flex-1 w-full p-10 resize-none focus:outline-none text-base leading-[1.8] text-slate-700 dark:text-slate-300 bg-transparent selection-product"
        
        style={{ fontFamily: UI_THEME.FONTS.PREVIEW }}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        spellCheck={false}
        placeholder="在此輸入您的 Markdown 稿件..."
      />

      <SlashCommandMenu
        isOpen={isOpen}
        position={position}
        items={filteredCommands}
        selectedIndex={selectedIndex}
        onSelect={insertCommand}
        onClose={closeMenu}
      />
    </div>
  );
};

function isMarkdownPath(path: string) {
  return /\.(md|markdown|mdown)$/i.test(path);
}
