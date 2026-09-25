/**
 * Core domain logic for Agent Skill Studio.
 *
 * An "agent skill" follows the SKILL.md convention used by Claude Code and
 * other agent harnesses: a markdown file with YAML frontmatter carrying at
 * least `name` and `description`, followed by the skill instructions.
 *
 * Everything here is local-first: persistence goes to localStorage, and
 * import/export works with plain .md files. No server involved.
 */

export interface Skill {
  /** Stable id: `bundled:<name>` for bundled skills, nanoid for user skills. */
  id: string;
  /** Frontmatter `name`: lowercase letters, numbers, hyphens, max 64 chars. */
  name: string;
  /** Frontmatter `description`: what the skill does / when to use it. */
  description: string;
  /** Organizational tags (stored in frontmatter on export). */
  tags: string[];
  /** Markdown instructions below the frontmatter. */
  body: string;
  /** Optional frontmatter `license`. */
  license?: string;
  source: "bundled" | "user";
  createdAt: number;
  updatedAt: number;
}

export type SkillDraft = Pick<Skill, "name" | "description" | "tags" | "body"> & {
  license?: string;
};

export interface ValidationIssue {
  level: "error" | "warning";
  field: "name" | "description" | "body";
  message: string;
}

export const NAME_PATTERN = /^[a-z0-9-]+$/;
export const MAX_NAME_LENGTH = 64;
export const MAX_DESCRIPTION_LENGTH = 1024;

// ---------------------------------------------------------------------------
// Validation (mirrors the Claude Code / Agent Skills spec)
// ---------------------------------------------------------------------------

export function validateSkill(draft: SkillDraft, existingNames: string[] = []): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const name = draft.name.trim();
  const description = draft.description.trim();
  const body = draft.body.trim();

  if (!name) {
    issues.push({ level: "error", field: "name", message: "Name is required." });
  } else {
    if (name.length > MAX_NAME_LENGTH) {
      issues.push({
        level: "error",
        field: "name",
        message: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
      });
    }
    if (!NAME_PATTERN.test(name)) {
      issues.push({
        level: "error",
        field: "name",
        message: "Name may only contain lowercase letters, numbers, and hyphens.",
      });
    }
    const clash = existingNames.includes(name);
    if (clash) {
      issues.push({
        level: "error",
        field: "name",
        message: `A skill named "${name}" already exists.`,
      });
    }
  }

  if (!description) {
    issues.push({ level: "error", field: "description", message: "Description is required." });
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    issues.push({
      level: "warning",
      field: "description",
      message: `Description is long (${description.length} chars). Keep it under ${MAX_DESCRIPTION_LENGTH} so agents can match it quickly.`,
    });
  }

  if (!body) {
    issues.push({
      level: "warning",
      field: "body",
      message: "Skill body is empty — add instructions the agent should follow.",
    });
  } else if (!/^#{1,3}\s/m.test(body)) {
    issues.push({
      level: "warning",
      field: "body",
      message: "Consider starting the body with a markdown heading for readability.",
    });
  }

  return issues;
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.level === "error");
}

// ---------------------------------------------------------------------------
// Frontmatter parsing / serialization (small purpose-built parser, no deps)
// ---------------------------------------------------------------------------

function unquote(value: string): string {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function parseScalarList(value: string): string[] {
  const v = value.trim();
  if (v.startsWith("[") && v.endsWith("]")) {
    return v
      .slice(1, -1)
      .split(",")
      .map((s) => unquote(s.trim()))
      .filter(Boolean);
  }
  return [unquote(v)].filter(Boolean);
}

export interface ParsedSkillFile {
  name: string;
  description: string;
  license?: string;
  tags: string[];
  body: string;
  hasFrontmatter: boolean;
}

/** Split a SKILL.md document into frontmatter fields + markdown body. */
export function parseSkillMarkdown(markdown: string): ParsedSkillFile {
  const empty: ParsedSkillFile = {
    name: "",
    description: "",
    tags: [],
    body: markdown.trim(),
    hasFrontmatter: false,
  };

  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return empty;

  const [, rawFm, rawBody] = match;
  const fm: Record<string, string | string[]> = {};
  let currentListKey: string | null = null;

  for (const line of rawFm.split(/\r?\n/)) {
    const listItem = line.match(/^\s*-\s+(.+)$/);
    if (listItem && currentListKey) {
      (fm[currentListKey] as string[]).push(unquote(listItem[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      const [, key, value] = kv;
      if (value.trim() === "") {
        fm[key] = [];
        currentListKey = key;
      } else {
        fm[key] = key === "tags" ? parseScalarList(value) : unquote(value);
        currentListKey = null;
      }
    } else {
      currentListKey = null;
    }
  }

  const asString = (v: unknown): string => (typeof v === "string" ? v : "");
  const asTags = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  return {
    name: asString(fm["name"]),
    description: asString(fm["description"]),
    license: asString(fm["license"]) || undefined,
    tags: asTags(fm["tags"]),
    body: rawBody.trim(),
    hasFrontmatter: true,
  };
}

function quote(value: string): string {
  if (/[:#\[\]{},&*!|>'"%@`]/.test(value) || /^\s|\s$/.test(value)) {
    return JSON.stringify(value);
  }
  return value;
}

/** Serialize a skill draft to a SKILL.md document. */
export function serializeSkill(draft: SkillDraft): string {
  const lines = [
    "---",
    `name: ${draft.name.trim()}`,
    `description: ${quote(draft.description.trim())}`,
  ];
  if (draft.license?.trim()) lines.push(`license: ${quote(draft.license.trim())}`);
  const tags = draft.tags.map((t) => t.trim()).filter(Boolean);
  if (tags.length > 0) lines.push(`tags: [${tags.join(", ")}]`);
  lines.push("---", "", draft.body.trimEnd() + "\n");
  return lines.join("\n");
}

/** Derive a valid skill name from a filename (used on import fallback). */
export function nameFromFilename(filename: string): string {
  return (
    filename
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_NAME_LENGTH) || "imported-skill"
  );
}

// ---------------------------------------------------------------------------
// File download / clipboard helpers
// ---------------------------------------------------------------------------

export function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------

const USER_SKILLS_KEY = "agent-skill-studio:user-skills:v1";
const DISABLED_KEY = "agent-skill-studio:disabled:v1";
const DELETED_BUNDLED_KEY = "agent-skill-studio:deleted-bundled:v1";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — stay functional without persistence */
  }
}

export const storage = {
  loadUserSkills: (): Skill[] => readJson<Skill[]>(USER_SKILLS_KEY, []),
  saveUserSkills: (skills: Skill[]) => writeJson(USER_SKILLS_KEY, skills),
  loadDisabledIds: (): string[] => readJson<string[]>(DISABLED_KEY, []),
  saveDisabledIds: (ids: string[]) => writeJson(DISABLED_KEY, ids),
  loadDeletedBundled: (): string[] => readJson<string[]>(DELETED_BUNDLED_KEY, []),
  saveDeletedBundled: (ids: string[]) => writeJson(DELETED_BUNDLED_KEY, ids),
  resetAll: () => {
    localStorage.removeItem(USER_SKILLS_KEY);
    localStorage.removeItem(DISABLED_KEY);
    localStorage.removeItem(DELETED_BUNDLED_KEY);
  },
};
