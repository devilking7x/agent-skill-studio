import type { SkillDraft } from "./skills";

/**
 * Module-scoped handoff for the "Import .md" flow: Home parses the uploaded
 * file and stashes the draft here, then navigates to /new where the editor
 * picks it up. Kept outside React state on purpose — it's a one-shot handoff.
 */
let pending: SkillDraft | null = null;

export function setImportDraft(draft: SkillDraft | null): void {
  pending = draft;
}

export function takeImportDraft(): SkillDraft | null {
  const d = pending;
  pending = null;
  return d;
}
