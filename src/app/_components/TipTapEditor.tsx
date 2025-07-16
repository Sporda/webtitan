"use client";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import Image from "@tiptap/extension-image";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const TipTapEditor = ({ value, onChange, placeholder }: Props) => {
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[150px] border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500",
        spellCheck: "true",
        placeholder: placeholder || "Napište článek...",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);
  return (
    <div>
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={editor?.isActive("bold") ? "font-bold text-blue-600" : ""}
          aria-label="Tučně"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={editor?.isActive("italic") ? "italic text-blue-600" : ""}
          aria-label="Kurzíva"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={editor?.isActive("bulletList") ? "text-blue-600" : ""}
          aria-label="Odrážky"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={editor?.isActive("orderedList") ? "text-blue-600" : ""}
          aria-label="Číslovaný seznam"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("Vlož URL obrázku");
            if (url) {
              editor?.chain().focus().setImage({ src: url }).run();
            }
          }}
          aria-label="Vložit obrázek"
          className="text-blue-600"
        >
          🖼️
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default TipTapEditor;
