'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { useEffect } from 'react';

interface Props {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  maxLength?: number;
}

interface ToolbarButton {
  key: string;
  label: string;
  title: string;
  isActive?: () => boolean;
  action: () => void;
}

export function RichBioEditor({ value, onChange, placeholder, maxLength = 2000 }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Tell the team who you are...',
      }),
      Markdown.configure({
        html: false,
        breaks: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // tiptap-markdown adds storage.markdown.getMarkdown()
      const md = (editor.storage as { markdown?: { getMarkdown: () => string } }).markdown?.getMarkdown() ?? editor.getText();
      onChange(md);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm max-w-none min-h-[180px] px-3 py-3 focus:outline-none rich-bio-content',
      },
    },
  });

  // Keep external value sync (e.g. when parent resets)
  useEffect(() => {
    if (!editor) return;
    const current = (editor.storage as { markdown?: { getMarkdown: () => string } }).markdown?.getMarkdown() ?? '';
    if (current !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="border border-white/[0.08] rounded bg-[#0a1628] min-h-[260px] flex items-center justify-center text-xs text-gray-600">
        Loading editor...
      </div>
    );
  }

  function promptLink() {
    const prev = editor!.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', prev || 'https://');
    if (url === null) return; // cancelled
    if (url === '') {
      editor!.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    let href = url.trim();
    if (!/^https?:\/\//i.test(href) && !href.startsWith('mailto:')) {
      href = `https://${href}`;
    }
    editor!.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }

  const buttons: ToolbarButton[] = [
    {
      key: 'bold',
      label: 'B',
      title: 'Bold (Cmd/Ctrl+B)',
      isActive: () => editor.isActive('bold'),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: 'italic',
      label: 'I',
      title: 'Italic (Cmd/Ctrl+I)',
      isActive: () => editor.isActive('italic'),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: 'h2',
      label: 'H',
      title: 'Heading',
      isActive: () => editor.isActive('heading', { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: 'h3',
      label: 'h',
      title: 'Subheading',
      isActive: () => editor.isActive('heading', { level: 3 }),
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      key: 'ul',
      label: '• List',
      title: 'Bullet list',
      isActive: () => editor.isActive('bulletList'),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'ol',
      label: '1. List',
      title: 'Numbered list',
      isActive: () => editor.isActive('orderedList'),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: 'quote',
      label: '" Quote',
      title: 'Quote',
      isActive: () => editor.isActive('blockquote'),
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      key: 'link',
      label: 'Link',
      title: 'Add or edit link',
      isActive: () => editor.isActive('link'),
      action: promptLink,
    },
    {
      key: 'hr',
      label: '— Divider',
      title: 'Horizontal divider',
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      key: 'clear',
      label: 'Clear',
      title: 'Strip formatting from selection',
      action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
    },
  ];

  const charCount = editor.storage.characterCount?.characters?.() ?? editor.getText().length;
  const overLimit = charCount > maxLength;

  return (
    <div className="border border-white/[0.08] rounded overflow-hidden bg-[#0a1628]">
      <div className="flex flex-wrap gap-1 bg-[#0d1b2a] border-b border-white/[0.08] px-2 py-1.5 sticky top-0 z-10">
        {buttons.map((b) => {
          const active = b.isActive?.() ?? false;
          return (
            <button
              key={b.key}
              type="button"
              title={b.title}
              onClick={b.action}
              className={`text-[11px] px-2 py-1 rounded font-mono transition-colors ${
                active
                  ? 'bg-[#f5a623]/20 text-[#f5a623]'
                  : 'text-gray-300 hover:bg-[#f5a623]/10 hover:text-[#f5a623]'
              }`}
            >
              {b.label}
            </button>
          );
        })}
        <span className={`ml-auto self-center text-[10px] ${overLimit ? 'text-red-400' : 'text-gray-600'}`}>
          {charCount}/{maxLength}
        </span>
      </div>

      <EditorContent editor={editor} />

      <style>{`
        .rich-bio-content p { margin-bottom: 0.65rem; }
        .rich-bio-content p:last-child { margin-bottom: 0; }
        .rich-bio-content h2 {
          font-size: 1rem;
          font-weight: 700;
          color: #f5a623;
          margin: 0.85rem 0 0.4rem;
        }
        .rich-bio-content h3 {
          font-size: 0.9rem;
          font-weight: 700;
          color: #fbbf24;
          margin: 0.7rem 0 0.3rem;
        }
        .rich-bio-content ul, .rich-bio-content ol { margin: 0.4rem 0 0.65rem 1.25rem; }
        .rich-bio-content ul { list-style: disc; }
        .rich-bio-content ol { list-style: decimal; }
        .rich-bio-content li { margin-bottom: 0.2rem; }
        .rich-bio-content li > p { margin-bottom: 0; }
        .rich-bio-content strong { color: #fff; font-weight: 700; }
        .rich-bio-content em { color: #fbbf24; }
        .rich-bio-content a { color: #f5a623; text-decoration: underline; }
        .rich-bio-content blockquote {
          border-left: 2px solid rgba(245,166,35,0.5);
          padding-left: 0.75rem;
          margin: 0.5rem 0;
          color: #cbd5e1;
          font-style: italic;
        }
        .rich-bio-content hr {
          border: 0;
          border-top: 1px solid rgba(255,255,255,0.1);
          margin: 0.75rem 0;
        }
        .rich-bio-content p.is-editor-empty:first-child::before {
          color: rgba(148, 163, 184, 0.4);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .rich-bio-content {
          color: #e2e8f0;
        }
      `}</style>
    </div>
  );
}
