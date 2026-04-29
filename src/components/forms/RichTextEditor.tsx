'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
}

const TOOLBAR_BUTTON =
  'p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed';
const TOOLBAR_BUTTON_ACTIVE =
  'p-1.5 rounded-md text-black bg-gray-100 hover:bg-gray-200 transition-colors';

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  hasError = false,
  disabled = false,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-slate max-w-none min-h-[200px] px-4 py-3 outline-none',
          'text-base font-normal leading-relaxed text-foreground',
          'focus:outline-none',
        ),
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const currentContent = editor.getHTML();
    if (value !== currentContent) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-xl border border-input min-h-50 bg-muted/20 animate-pulse',
          hasError && 'border-red-500',
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white overflow-hidden transition-colors',
        'focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20',
        hasError && 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/30',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          className={editor.isActive('bold') ? TOOLBAR_BUTTON_ACTIVE : TOOLBAR_BUTTON}
          aria-label="Bold"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          className={editor.isActive('italic') ? TOOLBAR_BUTTON_ACTIVE : TOOLBAR_BUTTON}
          aria-label="Italic"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          className={editor.isActive('heading', { level: 2 }) ? TOOLBAR_BUTTON_ACTIVE : TOOLBAR_BUTTON}
          aria-label="Heading 2"
          title="Section heading"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          className={editor.isActive('heading', { level: 3 }) ? TOOLBAR_BUTTON_ACTIVE : TOOLBAR_BUTTON}
          aria-label="Heading 3"
          title="Sub-heading"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={editor.isActive('bulletList') ? TOOLBAR_BUTTON_ACTIVE : TOOLBAR_BUTTON}
          aria-label="Bullet list"
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={editor.isActive('orderedList') ? TOOLBAR_BUTTON_ACTIVE : TOOLBAR_BUTTON}
          aria-label="Numbered list"
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
