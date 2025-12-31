import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalEditor as LexicalEditorType, EditorState, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from 'lexical';

export interface LexicalEditorHandle {
  getContent: () => string;
  setContent: (html: string) => void;
  getTextContent: () => string;
  focus: () => void;
  isEditable: () => boolean;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  undo: () => void;
  redo: () => void;
}

interface LexicalEditorProps {
  initialContent?: string;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  onContentChange?: (content: string) => void;
  onFormatChange?: () => void;
  className?: string;
  placeholder?: string;
}


// Plugin to apply global font size and alignment
function GlobalStylePlugin({ fontSize, textAlign }: { fontSize: number; textAlign: 'left' | 'center' | 'right' | 'justify' }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.style.fontSize = `${fontSize}pt`;
      rootElement.style.textAlign = textAlign;
    }
  }, [editor, fontSize, textAlign]);

  return null;
}

export const LexicalEditor = forwardRef<LexicalEditorHandle, LexicalEditorProps>(
  ({ initialContent = '', fontSize = 14, textAlign = 'left', onContentChange, onFormatChange, className = '', placeholder = 'Start typing...' }, ref) => {
    const editorRef = useRef<LexicalEditorType | null>(null);
    const hasInitializedRef = useRef(false);

    const initialConfig = {
      namespace: 'WordEditor',
      theme: {
        paragraph: 'editor-paragraph',
        heading: {
          h1: 'editor-heading-h1',
          h2: 'editor-heading-h2',
          h3: 'editor-heading-h3',
        },
        text: {
          bold: 'editor-text-bold',
          italic: 'editor-text-italic',
          underline: 'editor-text-underline',
        },
      },
      onError: (error: Error) => {
        console.error('Lexical error:', error);
      },
      nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode,
      ],
    };

    useImperativeHandle(ref, () => ({
      getContent: () => {
        if (!editorRef.current) return '';
        let html = '';
        editorRef.current.getEditorState().read(() => {
          html = $generateHtmlFromNodes(editorRef.current!, null);
        });
        return html;
      },
      setContent: (html: string) => {
        if (!editorRef.current) return;
        // Mark as initialized so InitialContentPlugin knows this is an explicit content set
        hasInitializedRef.current = true;
        editorRef.current.update(() => {
          const parser = new DOMParser();
          const dom = parser.parseFromString(html, 'text/html');
          const nodes = $generateNodesFromDOM(editorRef.current!, dom);
          const root = $getRoot();
          root.clear();
          root.append(...nodes);
        });
      },
      getTextContent: () => {
        if (!editorRef.current) return '';
        let text = '';
        editorRef.current.getEditorState().read(() => {
          const root = $getRoot();
          text = root.getTextContent();
        });
        return text;
      },
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      },
      isEditable: () => {
        return editorRef.current?.isEditable() ?? false;
      },
      toggleBold: () => {
        if (!editorRef.current) return;
        editorRef.current.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.formatText('bold');
          }
        });
      },
      toggleItalic: () => {
        if (!editorRef.current) return;
        editorRef.current.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.formatText('italic');
          }
        });
      },
      toggleUnderline: () => {
        if (!editorRef.current) return;
        editorRef.current.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.formatText('underline');
          }
        });
      },
      undo: () => {
        if (editorRef.current) {
          editorRef.current.dispatchCommand(UNDO_COMMAND, undefined);
        }
      },
      redo: () => {
        if (editorRef.current) {
          editorRef.current.dispatchCommand(REDO_COMMAND, undefined);
        }
      },
    }));

    const handleChange = (editorState: EditorState, editor: LexicalEditorType) => {
      editorRef.current = editor;
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor, null);
        onContentChange?.(html);
      });
    };

    return (
      <LexicalComposer initialConfig={initialConfig}>
        <div className={`lexical-editor-wrapper h-full flex flex-col ${className}`} data-lexical-editor="true">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="flex-1 w-full bg-gray-800/50 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-cyber-purple-500/50 cursor-text overflow-auto"
                style={{
                  fontSize: `${fontSize}pt`,
                  textAlign,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.6',
                }}
              />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-gray-500 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={({ children }) => <>{children}</>}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleChange} />
          <GlobalStylePlugin fontSize={fontSize} textAlign={textAlign} />
          <EditorRefPlugin editorRef={editorRef} />
          <InitialContentPlugin initialContent={initialContent} hasInitializedRef={hasInitializedRef} />
          <FormatChangePlugin onFormatChange={onFormatChange} />
        </div>
      </LexicalComposer>
    );
  }
);

LexicalEditor.displayName = 'LexicalEditor';

// Plugin to capture editor reference
function EditorRefPlugin({ editorRef }: { editorRef: React.MutableRefObject<LexicalEditorType | null> }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    editorRef.current = editor;
  }, [editor, editorRef]);

  return null;
}

// Plugin to load initial content - only runs once on mount
// File loads are handled by setContent() method, not this plugin
function InitialContentPlugin({ 
  initialContent, 
  hasInitializedRef
}: { 
  initialContent: string; 
  hasInitializedRef: React.MutableRefObject<boolean>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Only load initial content once when editor first mounts
    // After that, use setContent() for explicit content updates (like file loads)
    // This prevents the plugin from interfering with normal typing or file loads
    if (!hasInitializedRef.current && editor && initialContent) {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialContent, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        root.append(...nodes);
      });
      hasInitializedRef.current = true;
    }
  }, [editor, initialContent, hasInitializedRef]);

  return null;
}

// Plugin to notify parent when formatting changes (for keyboard shortcuts)
function FormatChangePlugin({ onFormatChange }: { onFormatChange?: () => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onFormatChange) return;

    // Listen for format text commands (bold, italic, underline)
    const unregisterFormat = editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      () => {
        // Use setTimeout to ensure the format change has been applied
        setTimeout(() => {
          onFormatChange();
        }, 0);
        return false; // Don't prevent default, let Lexical handle it
      },
      COMMAND_PRIORITY_EDITOR
    );

    // Listen for undo/redo commands - these will trigger content changes
    // The OnChangePlugin will handle updating content, we just need to mark as changed
    const unregisterUndo = editor.registerCommand(
      UNDO_COMMAND,
      () => {
        // Use setTimeout to ensure undo has been applied
        setTimeout(() => {
          onFormatChange();
        }, 0);
        return false; // Don't prevent default, let HistoryPlugin handle it
      },
      COMMAND_PRIORITY_EDITOR
    );

    const unregisterRedo = editor.registerCommand(
      REDO_COMMAND,
      () => {
        // Use setTimeout to ensure redo has been applied
        setTimeout(() => {
          onFormatChange();
        }, 0);
        return false; // Don't prevent default, let HistoryPlugin handle it
      },
      COMMAND_PRIORITY_EDITOR
    );

    return () => {
      unregisterFormat();
      unregisterUndo();
      unregisterRedo();
    };
  }, [editor, onFormatChange]);

  return null;
}

