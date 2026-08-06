"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Icon } from "@/app/panel/_components/Icon";

/**
 * Toolbar glyphs the panel's shared Icon set doesn't carry. Kept local rather
 * than added to Icon.tsx because nothing outside this toolbar wants them.
 */
function Svg({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}
const PATH = {
  undo: "M3 7v6h6M3.5 12a9 9 0 1 0 2.6-5.6L3 9",
  redo: "M21 7v6h-6M20.5 12a9 9 0 1 1-2.6-5.6L21 9",
  bulletList: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  eraser: "M4 20h16M12.5 4.5 20 12l-7 7H8l-4-4Z",
  code: "m16 18 6-6-6-6M8 6l-6 6 6 6",
};

/**
 * WYSIWYG body editor for blog posts.
 *
 * The field still stores plain HTML — exactly what `<ArticleBody>` renders on
 * the site — so old posts open unchanged and nothing about the storefront has
 * to know an editor exists. The editor only changes who has to TYPE that HTML:
 * the content team clicks a button instead of writing `<h2>` by hand.
 *
 * The toolbar covers exactly the tags `<ArticleBody>` styles — p, h1-h4, ul,
 * ol, blockquote, a, strong/em/u/s, img, hr. Keep the two in step: a button
 * here with no matching style there ships unstyled markup to readers.
 */

/**
 * Level 0 is a normal paragraph (`<p>`). H1 is offered because the owner asked
 * for it, but note it competes with the post title, which is already the page's
 * H1 — H2 is the right start for body headings.
 */
const HEADINGS = [
  { label: "Paragraph", level: 0 },
  { label: "Heading 1", level: 1 },
  { label: "Heading 2", level: 2 },
  { label: "Heading 3", level: 3 },
  { label: "Heading 4", level: 4 },
] as const;

type Level = 1 | 2 | 3 | 4;
const LEVELS: Level[] = [1, 2, 3, 4];

/** Toolbar button. `active` mirrors the mark under the cursor. */
function TbButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep the selection alive
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-sm transition ${
        active
          ? "bg-brand text-white"
          : "text-ink hover:bg-soft disabled:opacity-35 disabled:hover:bg-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-line" aria-hidden />;
}

/**
 * Heading picker.
 *
 * `setNode` rather than `toggleHeading`: toggling turns the heading back into a
 * paragraph when the same level is chosen twice, which reads as "the dropdown
 * ignored me". Picking a style should always mean "make it this".
 */
function HeadingSelect({
  current,
  onPick,
}: {
  current: number;
  onPick: (level: number) => void;
}) {
  return (
    <select
      value={current}
      onChange={(e) => onPick(Number(e.target.value))}
      title="Text style"
      aria-label="Text style"
      className="h-8 rounded-lg border border-line bg-white px-2 text-sm font-medium text-ink outline-none transition focus:border-brand"
    >
      {HEADINGS.map((h) => (
        <option key={h.level} value={h.level}>
          {h.label}
        </option>
      ))}
    </select>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  placeholder?: string;
}) {
  const html = String(value ?? "");
  const [showSource, setShowSource] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    // Next.js renders this on the server first; without it React warns about a
    // hydration mismatch on every mount.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: LEVELS },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
    ],
    content: html,
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] w-full px-4 py-3 outline-none " +
          // Mirror ArticleBody so what the writer sees matches the live page.
          "[&_p]:mb-3 [&_p]:leading-relaxed " +
          "[&_h1]:mt-6 [&_h1]:mb-2.5 [&_h1]:text-2xl [&_h1]:font-extrabold " +
          "[&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold " +
          "[&_h3]:mt-5 [&_h3]:mb-1.5 [&_h3]:text-lg [&_h3]:font-bold " +
          "[&_h4]:mt-4 [&_h4]:mb-1 [&_h4]:text-base [&_h4]:font-bold " +
          "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_blockquote]:italic " +
          "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 " +
          "[&_a]:font-semibold [&_a]:text-brand [&_a]:underline " +
          "[&_img]:my-4 [&_img]:rounded-xl [&_hr]:my-6 [&_hr]:border-line",
      },
    },
    onUpdate: ({ editor }) => {
      // Empty document serialises to "<p></p>" — store "" so "is it filled in?"
      // checks elsewhere keep working.
      const out = editor.getHTML();
      onChange(out === "<p></p>" ? "" : out);
    },
  });

  /**
   * Tiptap v3 does NOT re-render on every transaction any more
   * (`shouldRerenderOnTransaction` defaults to false), so a toolbar that reads
   * `editor.isActive(...)` straight from render is frozen at mount: the style
   * dropdown keeps showing whatever it computed first, and re-picking that same
   * option fires no change event — which is why a heading could only be applied
   * once per document. `useEditorState` subscribes properly and re-renders the
   * toolbar whenever the selection or content moves.
   */
  const ui = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null;
      return {
        heading: LEVELS.find((l) => editor.isActive("heading", { level: l })) ?? 0,
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        underline: editor.isActive("underline"),
        strike: editor.isActive("strike"),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        blockquote: editor.isActive("blockquote"),
        link: editor.isActive("link"),
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
      };
    },
  });

  // Re-sync when the form loads a different record into the same editor.
  useEffect(() => {
    if (!editor) return;
    if (html !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
  }, [html, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (leave empty to remove)", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }, [editor]);

  const uploadImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/panel/upload", { method: "POST", body });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          window.alert(data?.message ?? "Upload failed.");
          return;
        }
        editor.chain().focus().setImage({ src: data.url, alt: "" }).run();
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  if (!editor) {
    return (
      <div className="min-h-[380px] animate-pulse rounded-xl border border-line bg-soft/60" />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
      {/* ---------------------------- Toolbar ---------------------------- */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-soft/70 px-2 py-1.5">
        <TbButton
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!ui?.canUndo}
        >
          <Svg d={PATH.undo} />
        </TbButton>
        <TbButton
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!ui?.canRedo}
        >
          <Svg d={PATH.redo} />
        </TbButton>

        <Divider />
        <HeadingSelect
          current={ui?.heading ?? 0}
          onPick={(level) => {
            const chain = editor.chain().focus();
            if (level === 0) chain.setParagraph().run();
            else chain.setNode("heading", { level }).run();
          }}
        />
        <Divider />

        <TbButton
          title="Bold"
          active={ui?.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="font-black">B</span>
        </TbButton>
        <TbButton
          title="Italic"
          active={ui?.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="font-serif italic">I</span>
        </TbButton>
        <TbButton
          title="Underline"
          active={ui?.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </TbButton>
        <TbButton
          title="Strikethrough"
          active={ui?.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <span className="line-through">S</span>
        </TbButton>

        <Divider />

        <TbButton
          title="Bulleted list"
          active={ui?.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <Svg d={PATH.bulletList} />
        </TbButton>
        <TbButton
          title="Numbered list"
          active={ui?.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <span className="text-[11px] font-bold">1.</span>
        </TbButton>
        <TbButton
          title="Quote"
          active={ui?.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <span className="text-base leading-none">&ldquo;</span>
        </TbButton>
        <TbButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <span className="text-xs">—</span>
        </TbButton>

        <Divider />

        <TbButton title="Link" active={ui?.link} onClick={setLink}>
          <Icon name="external" size={15} />
        </TbButton>
        <TbButton
          title={uploading ? "Uploading…" : "Insert image"}
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Icon name="image" size={15} />
        </TbButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void uploadImage(f);
          }}
        />

        <Divider />

        <TbButton
          title="Clear formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <Svg d={PATH.eraser} />
        </TbButton>

        {/* Escape hatch for whoever wants the raw markup. */}
        <button
          type="button"
          onClick={() => setShowSource((s) => !s)}
          className={`ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition ${
            showSource ? "bg-ink text-white" : "text-muted hover:bg-soft hover:text-ink"
          }`}
        >
          <Svg d={PATH.code} size={14} />
          HTML
        </button>
      </div>

      {/* ----------------------------- Body ------------------------------ */}
      {showSource ? (
        <textarea
          className="min-h-[320px] w-full resize-y bg-white px-4 py-3 font-mono text-xs leading-relaxed text-ink outline-none"
          value={html}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            editor.commands.setContent(e.target.value, { emitUpdate: false });
          }}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}
