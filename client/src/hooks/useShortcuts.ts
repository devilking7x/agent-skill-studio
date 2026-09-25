/**
 * Keyboard shortcuts for power users.
 *
 * - `/` focuses the skill search (library page)
 * - `Ctrl/⌘ S` saves the draft (editor) or exports the skill as .md (detail view)
 *
 * Handlers are registered per page/component; this hook keeps listener
 * bookkeeping in one place and ignores keystrokes while the user is typing.
 */

import { useEffect, useRef } from "react";

export interface ShortcutOptions {
  /** Require Ctrl (Windows/Linux) or ⌘ (macOS) to be held. */
  ctrlOrCmd?: boolean;
  /** Skip when focus is inside an input, textarea, select, or contentEditable. Defaults to true. */
  ignoreWhenTyping?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !("tagName" in el)) return false;
  const tag = (el.tagName || "").toUpperCase();
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable
  );
}

export function useShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  options: ShortcutOptions = {},
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const opts = optionsRef.current;
      if (e.key !== key) return;
      const mod = e.metaKey || e.ctrlKey;
      if (opts.ctrlOrCmd && !mod) return;
      if (!opts.ctrlOrCmd && mod) return;
      if (opts.ignoreWhenTyping !== false && isTypingTarget(e.target)) return;
      e.preventDefault();
      handlerRef.current(e);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key]);
}

/** Displayed in the shortcuts dialog — the full registry of app shortcuts. */
export interface ShortcutInfo {
  keys: string[];
  description: string;
  where: string;
}

export const APP_SHORTCUTS: ShortcutInfo[] = [
  {
    keys: ["/"],
    description: "Focus the skill search box",
    where: "Library",
  },
  {
    keys: ["Ctrl", "S"],
    description: "Save the skill draft",
    where: "Editor",
  },
  {
    keys: ["Ctrl", "S"],
    description: "Export the current skill as .md",
    where: "Skill detail",
  },
  {
    keys: ["Esc"],
    description: "Close dialogs",
    where: "Everywhere",
  },
];
