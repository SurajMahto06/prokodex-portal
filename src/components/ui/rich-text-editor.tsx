"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image", "video"],
        ["clean"],
      ],
    }),
    []
  );

  return (
    <div className="bg-zinc-950 text-zinc-100 rounded-md overflow-hidden border border-zinc-800">
      <style>{`
        .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid var(--color-zinc-800);
          background-color: var(--color-zinc-900);
        }
        .ql-container.ql-snow {
          border: none;
          background-color: var(--color-zinc-950);
          font-family: inherit;
          font-size: 14px;
        }
        .ql-editor {
          min-height: 300px;
          color: var(--color-zinc-100);
        }
        .ql-snow .ql-stroke {
          stroke: var(--color-zinc-400);
        }
        .ql-snow .ql-fill, .ql-snow .ql-stroke.ql-fill {
          fill: var(--color-zinc-400);
        }
        .ql-snow .ql-picker {
          color: var(--color-zinc-400);
        }
        .ql-snow .ql-picker-options {
          background-color: var(--color-zinc-900);
          border-color: var(--color-zinc-800);
        }
        .ql-snow .ql-picker-item:hover {
          color: var(--color-cyan-500);
        }
        .ql-snow.ql-toolbar button:hover .ql-stroke,
        .ql-snow .ql-toolbar button:hover .ql-stroke,
        .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .ql-snow .ql-toolbar button.ql-active .ql-stroke {
          stroke: var(--color-cyan-500);
        }
        .ql-snow.ql-toolbar button:hover .ql-fill,
        .ql-snow .ql-toolbar button:hover .ql-fill,
        .ql-snow.ql-toolbar button.ql-active .ql-fill,
        .ql-snow .ql-toolbar button.ql-active .ql-fill {
          fill: var(--color-cyan-500);
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
      />
    </div>
  );
}
