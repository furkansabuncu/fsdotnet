# fsbox

**Developer toolbox for the .NET ecosystem.** Fast, private, keyboard-first.

[![web](https://github.com/furkansabuncu/fsbox/actions/workflows/web.yml/badge.svg)](https://github.com/furkansabuncu/fsbox/actions/workflows/web.yml)
[![api](https://github.com/furkansabuncu/fsbox/actions/workflows/api.yml/badge.svg)](https://github.com/furkansabuncu/fsbox/actions/workflows/api.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> 🔗 **Live:** _coming soon_ · Press <kbd>Ctrl</kbd>+<kbd>K</kbd> anywhere to jump to a tool.

---

## Why another dev-tools site?

There are excellent general-purpose toolboxes already ([CyberChef](https://gchq.github.io/CyberChef/),
[it-tools](https://it-tools.tech/)). fsbox is not trying to be a smaller copy of them — it targets a gap
none of them cover well: **the .NET side of everyday development.**

| What you get here that you don't get elsewhere |
| --- |
| **SQL → LINQ / EF Core** translation backed by a real T-SQL parser, not regex |
| **JSON → C# POCO** emitted through Roslyn — records vs. classes, nullability, `System.Text.Json` attributes |
| **.NET regex flavour** (balancing groups, named captures, `RegexOptions`) — every other tester is JS-only |
| **Quartz.NET cron** (6–7 fields with seconds) alongside standard 5-field Unix cron |
| **.NET ticks** in the epoch converter (100 ns since `0001-01-01`) |
| HTTP status lookup that shows the `StatusCodes.Status404NotFound` constant name |

## Layout

One repository, two applications, deployed independently.

```
fsbox/
├── web/            React 19 · TypeScript · Vite · Tailwind CSS
├── api/            .NET 10 · Minimal API · vertical slices
│   ├── src/Fsbox.Api/
│   └── tests/Fsbox.Api.Tests/
├── docs/adr/       architecture decision records
└── .github/        two path-filtered workflows — web changes don't run the .NET job
```

## Architecture

### 1. Client-side by default — the backend has to earn its keep

Most "converters" are pure functions. Making a network round-trip to Base64-decode a string is a design
smell, and for tools that handle **JWTs, HMAC keys and password hashes it is a genuine privacy problem**.

So the rule is inverted from the usual: a tool runs in the browser unless it *needs* a real parser or
compiler that only exists on .NET.

| Runs entirely in your browser | Needs the API | Why the API |
| --- | --- | --- |
| Base64 · UUID · Hash & HMAC · JWT decode | **SQL → LINQ** | `Microsoft.SqlServer.TransactSql.ScriptDom` |
| Epoch · Cron · HTTP status · Color & WCAG | **JSON → C# POCO** | Roslyn `SyntaxFactory` |
| CSV · XML ⇄ JSON · JSON/HTML/CSS format | **SQL formatter** | `SqlScriptGenerator`, with error positions |
| Regex (JS flavour) | **Regex (.NET flavour)** | `System.Text.RegularExpressions` |

Two things fall out of this for free: **no secret ever reaches the server**, and the site keeps working
when the API is cold or down — tools that need it are marked with an `API` badge.

→ [ADR-0001: Client-side by default](docs/adr/0001-client-side-by-default.md)

### 2. One tool, one folder — on both sides

Fifteen tools written as fifteen hand-rolled pages is not an architecture. Every tool is a
self-describing module that registers itself; **routing, search, the home grid and the command palette
are all derived from one registry.**

```
web/src/tools/base64/              api/src/Fsbox.Api/Features/SqlToLinq/
├── index.ts        definition     ├── SqlToLinqEndpoint.cs   thin: bind, delegate
├── base64.ts       pure logic     ├── SqlToLinqEngine.cs     the logic, no HTTP types
├── base64.test.ts  table-driven   └── SqlToLinqModels.cs     request/response records
└── Base64Tool.tsx  UI
```

The same shape on both sides, for the same reason: **the part worth testing is the part that isn't
framework code.** On the frontend that means a pure function outside React; on the backend an engine
class that never sees `HttpContext`. Backend slices self-register through `IEndpoint`, so `Program.cs`
names no tool — the mirror image of the frontend registry.

Errors are values, not exceptions. Every frontend tool returns
`ToolResult<T> = { ok: true, value: T } | { ok: false, error: string }`; invalid input is an expected
outcome for a converter, so error rendering is uniform and free.

→ [ADR-0002: Single API, vertical slices](docs/adr/0002-single-api-vertical-slices.md) ·
[ADR-0003: Tool registry](docs/adr/0003-tool-registry.md)

## Adding a tool

Frontend:

1. `my-tool.ts` — the pure function, returning `ToolResult<T>`
2. `my-tool.test.ts` — table-driven cases, including the ugly inputs
3. `MyTool.tsx` — UI, usually just `<ConverterShell>` plus a toolbar
4. `index.ts` — the `ToolDefinition`
5. One line in `registry.ts`

Routing, search, the palette and the home page pick it up automatically. If the tool needs the API, add
a matching slice under `api/src/Fsbox.Api/Features/` — it self-registers under `/api/v1`.

## Tech stack

**web** — React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router v7 · Vitest
**api** — .NET 10 · Minimal API · Roslyn · ScriptDom · xUnit · warnings-as-errors

## Running locally

```bash
# frontend  → http://localhost:5173
cd web && npm install && npm run dev

# backend   → http://localhost:5106, OpenAPI at /openapi/v1.json
cd api && dotnet run --project src/Fsbox.Api
```

| web | | api | |
| --- | --- | --- | --- |
| `npm run dev` | Vite dev server | `dotnet run --project src/Fsbox.Api` | run the API |
| `npm test` | test suite | `dotnet test` | test suite |
| `npm run test:coverage` | coverage, gated at 90% on tool logic | `dotnet build` | warnings are errors |
| `npm run typecheck` | `tsc --noEmit` | | |
| `npm run build` | typecheck + production build | | |

## Roadmap

- [x] **Phase 1** — registry, command palette, CI, API skeleton
  - [x] Base64 encoder/decoder
  - [ ] UUID/GUID generator · Hash & HMAC · JWT decoder
- [ ] **Phase 2** — the first real slice: JSON → C# POCO via Roslyn
- [ ] **Phase 3** — SQL → LINQ (scope stated up front: `SELECT`/`WHERE`/`JOIN`/`ORDER BY`/`GROUP BY`)
- [ ] **Phase 4** — the remaining converters, formatters and web tools

## Security notes

The API is a public endpoint that parses hostile input, so it is treated as one:

- Per-IP rate limiting (60 req/min) and request size limits on every endpoint
- Regex evaluation will be **ReDoS-bounded** (`matchTimeout` + input length cap)
- XML is handled in the browser; if it ever moves server-side, `DtdProcessing.Prohibit` and a null
  `XmlResolver` are mandatory (**XXE**)
- CORS is an explicit origin allow-list, empty by default
- No user input is ever logged

## License

MIT © Furkan Sabuncu
