# ADR-0003: A tool registry as the single source of truth

**Status:** Accepted · **Date:** 2026-08-19

## Context

The planned catalogue is roughly fifteen tools. The naive approach — one route, one page component and
one home-page card written by hand per tool — means every new tool requires edits in four or five
unrelated places, and the fifth tool is a copy of the fourth with the strings changed. Search and a
command palette then have to be maintained as yet another hand-written list that silently drifts.

There is also a bundle-size problem. Individual tools pull heavy dependencies — a formatter, a WASM hash
library, a syntax highlighter. Imported eagerly, a user opening the UUID generator pays to download all
of them.

## Decision

Each tool exports a **`ToolDefinition`**: id, name, description, category, search keywords, runtime
(`client` | `server`) and a **lazily imported** component. `registry.ts` holds the one array of them.

Routing, the home-page grid, category grouping, search and the <kbd>Ctrl</kbd>+<kbd>K</kbd> palette are
all **derived** from that array. There is a single dynamic route, `/t/:toolId`, that resolves through
the registry.

Two supporting rules:

- **Logic is separated from presentation.** A tool's core is a pure function in its own file, importing
  nothing from React. The component binds inputs to it.
- **Errors are values, not exceptions.** Every tool function returns
  `ToolResult<T> = { ok: true, value: T } | { ok: false, error: string }`. Invalid input is an expected
  outcome for a converter, not an exceptional one, and this keeps error rendering uniform across tools.

## Consequences

**Good.** Adding a tool is one folder plus one line in `registry.ts`; nothing else can be forgotten.
Code splitting is automatic — the production build emits a separate chunk per tool. The pure-function
rule makes tests table-driven and near-free to write, which is what makes a real coverage gate
(90% on `src/tools/**`) achievable rather than aspirational.

**Bad.** One extra indirection between a URL and the component that serves it, which is mildly harder to
follow when reading the code for the first time. The registry array is a merge-conflict point if several
tools are added in parallel — trivial to resolve, and not a concern for a single maintainer.
