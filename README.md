# Agent Skill Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org)
[![Local-first](https://img.shields.io/badge/local--first-100%25-brightgreen.svg)](#)

> Every skill your agents use, in one studio.

Agent Skill Studio is a **local-first web app** for creating, organizing, validating, and exporting **AI agent skills** in the `SKILL.md` format used by Claude Code and other agent harnesses. Everything runs in your browser — no account, no server, no telemetry. Your skills never leave your machine.

## ✨ Features

- 📚 **Skills library** — browse your skills as cards, with instant search, tag filters, and per-skill enable/disable toggles
- 🎁 **9 bundled sample skills** — `code-reviewer`, `commit-helper`, `doc-writer`, `test-generator`, `pr-summarizer`, `security-reviewer`, `regex-helper`, `api-tester`, `changelog-writer`, each with real, genuinely useful instructions
- ✍️ **Skill editor** — guided form with a markdown instructions editor, live preview, and **live frontmatter validation** against the Agent Skills spec
- 🛡️ **Security lint** — the validator flags suspicious patterns in skill instructions: `curl … | sh` pipes, embedded API keys and secrets, external URLs, base64 blobs, and destructive commands
- 📦 **Install bundles** — one-click download of a `.zip` that places the skill at the exact directory your harness expects (Claude Code, Codex, Cursor, Copilot, Gemini CLI)
- ⌨️ **Keyboard shortcuts** — `/` focuses search, `Ctrl/⌘ S` saves (editor) or exports (detail view); hit the keyboard icon for the full list
- 👁️ **Detail view** — rendered markdown preview, frontmatter summary, and validation status per skill
- 📥 **Import / 📤 Export** — drop in any `.md` file to create a skill; export skills as `.md` downloads or copy them straight to the clipboard
- 💾 **Local persistence** — custom skills live in `localStorage`, bundled samples stay pristine, and one click resets everything to defaults
- 🌗 **Dark / light theme** — switchable, persisted across visits

## 🚀 Quick Start

```bash
pnpm install
pnpm dev      # → http://localhost:3000
pnpm build    # → static output in dist/public
```

No environment variables, no backend, no database. `pnpm build` produces a fully static site you can host anywhere (GitHub Pages workflow included).

## 🧠 What is an agent skill?

An agent skill is a `SKILL.md` file: YAML frontmatter describing the skill, followed by markdown instructions the agent follows. Agent harnesses like Claude Code discover these files and load the right skill for the task.

```markdown
---
name: commit-helper
description: Write atomic, conventional git commits with clear messages.
license: MIT
tags: [git, workflow]
---

# Commit Helper

Help the user create clean, atomic git commits following the
Conventional Commits format: `type(scope): summary`.
...
```

**Frontmatter rules** (validated live in the editor):

| Field         | Required | Rule                                              |
| ------------- | -------- | ------------------------------------------------- |
| `name`        | ✅        | lowercase letters, numbers, hyphens · max 64 chars |
| `description` | ✅        | non-empty · what it does + when to use it         |
| `license`     | —        | optional                                          |
| `tags`        | —        | optional · organizational, used for filtering     |

## 📸 Screenshots

> Screenshots coming soon — the app ships with a dark studio theme and a light mode toggle.

*Library view with search + tag filters · Skill detail with rendered preview · Editor with live validation*

## 🗺️ Roadmap

- [x] Export skills as install `.zip` bundles per harness (Claude Code, Codex, Cursor, Copilot, Gemini)
- [ ] Skill templates gallery (starter templates per category)
- [ ] Duplicate-skill detection and merge helper
- [x] Keyboard shortcuts for power users
- [ ] Share skills via URL (compressed in the hash)

Have an idea? [Open an issue](../../issues) or send a PR.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first — it covers the dev workflow, code style, and how to propose new bundled skills.

## 📄 License

MIT © Agent Skill Studio contributors. See [LICENSE](LICENSE) for details.
