"use client";

import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Table,
  Type,
  Palette,
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor;
}

export default function Toolbar({ editor }: ToolbarProps) {
  const addImage = () => {
    const url = window.prompt('이미지 URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('링크 URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run();
  };

  return (
    <div className="border-b border-neutral-800 p-2 flex flex-wrap gap-2">
      <select 
        onChange={(e) => {
          const level = parseInt(e.target.value);
          if (level === 0) {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
          }
        }}
        className="bg-neutral-800 rounded px-2 py-1"
      >
        <option value="0">기본 텍스트</option>
        <option value="1">큰 제목</option>
        <option value="2">중간 제목</option>
        <option value="3">작은 제목</option>
      </select>

      <div className="h-6 w-px bg-neutral-700" />

      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded hover:bg-neutral-700 ${editor.isActive('bold') ? 'bg-neutral-700' : ''}`}
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded hover:bg-neutral-700 ${editor.isActive('italic') ? 'bg-neutral-700' : ''}`}
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1 rounded hover:bg-neutral-700 ${editor.isActive('underline') ? 'bg-neutral-700' : ''}`}
      >
        <Underline size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1 rounded hover:bg-neutral-700 ${editor.isActive('strike') ? 'bg-neutral-700' : ''}`}
      >
        <Strikethrough size={18} />
      </button>

      <div className="h-6 w-px bg-neutral-700" />

      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-1 rounded hover:bg-neutral-700 ${editor.isActive({ textAlign: 'left' }) ? 'bg-neutral-700' : ''}`}
      >
        <AlignLeft size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-1 rounded hover:bg-neutral-700 ${editor.isActive({ textAlign: 'center' }) ? 'bg-neutral-700' : ''}`}
      >
        <AlignCenter size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-1 rounded hover:bg-neutral-700 ${editor.isActive({ textAlign: 'right' }) ? 'bg-neutral-700' : ''}`}
      >
        <AlignRight size={18} />
      </button>

      <div className="h-6 w-px bg-neutral-700" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 rounded hover:bg-neutral-700 ${editor.isActive('bulletList') ? 'bg-neutral-700' : ''}`}
      >
        <List size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1 rounded hover:bg-neutral-700 ${editor.isActive('orderedList') ? 'bg-neutral-700' : ''}`}
      >
        <ListOrdered size={18} />
      </button>

      <div className="h-6 w-px bg-neutral-700" />

      <button
        onClick={addLink}
        className={`p-1 rounded hover:bg-neutral-700 ${editor.isActive('link') ? 'bg-neutral-700' : ''}`}
      >
        <Link size={18} />
      </button>
      <button
        onClick={addImage}
        className="p-1 rounded hover:bg-neutral-700"
      >
        <Image size={18} />
      </button>
      <button
        onClick={addTable}
        className={`p-1 rounded hover:bg-neutral-700 ${editor.isActive('table') ? 'bg-neutral-700' : ''}`}
      >
        <Table size={18} />
      </button>

      <div className="h-6 w-px bg-neutral-700" />

      <input
        type="color"
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        className="w-8 h-8 p-0 bg-transparent border-none cursor-pointer"
      />
    </div>
  );
} 