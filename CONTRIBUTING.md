# Contributing to Agent Skill Studio

Thanks for your interest! This studio is beginner-friendly — small improvements are very welcome, especially during Hacktoberfest.

## Ways to contribute

- **New skill templates** for the gallery (e.g. code-reviewer, commit-helper, test-writer)
- **Export improvements** — new export targets, filename customization
- **Validation rules** — catch more common `SKILL.md` mistakes
- **UI polish** — editor experience, mobile layout, keyboard shortcuts
- **Docs & typos** — clarifications make great first PRs

## Dev setup

```bash
npm install
npm run dev
```

Verify the production build before submitting:

```bash
npm run build
```

## Pull request process

1. Fork the repo and create a branch: `git checkout -b feat/my-change`
2. Make your change and verify `npm run build` passes
3. Open a PR describing **what** changed and **why**

## Ground rules

- **Stay local-first.** No network calls without discussing in an issue first.
- TypeScript + React, styled with Tailwind. Keep the bundle small.
