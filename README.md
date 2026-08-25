# fsdev

**Developer toolbox for the .NET ecosystem.** Fast, private, keyboard-first.

[![web](https://github.com/furkansabuncu/fsdev/actions/workflows/web.yml/badge.svg)](https://github.com/furkansabuncu/fsdev/actions/workflows/web.yml)
[![api](https://github.com/furkansabuncu/fsdev/actions/workflows/api.yml/badge.svg)](https://github.com/furkansabuncu/fsdev/actions/workflows/api.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> 🔗 **Live:** _coming soon_ · Press <kbd>Ctrl</kbd>+<kbd>K</kbd> anywhere to jump to a tool.

---

## Why another dev-tools site?

There are excellent general-purpose toolboxes already ([CyberChef](https://gchq.github.io/CyberChef/),
[it-tools](https://it-tools.tech/)). fsdev is not trying to be a smaller copy of them — it targets a gap
none of them cover well: **the .NET side of everyday development.**

| What you get here that you don't get elsewhere | |
| --- | --- |
| **Oracle error lookup** | `ORA-xxxxx` with the *cause*, not just the message |
| **IN (…) builder** | splits past 1000 expressions, because Oracle raises `ORA-01795` |
| **Bind substitution** | a logged query plus logged parameters, turned into something runnable |
| **Encoding forensics** | mojibake repair, RTF code pages, invisible-character detection — Turkish text breaks in specific ways, and these fix those ways |
| **Turkish test data** | TCKN and IBAN that pass their real checksums |
| **.NET ticks** | in the epoch converter (100 ns since `0001-01-01`) |
| **Turkish casing** | `tr-TR` vs invariant shown side by side — the `"file".ToUpper() == "FİLE"` trap |

## Layout

One repository, two applications, deployed independently.

```
fsdev/
├── web/            React 19 · TypeScript · Vite · Tailwind CSS
├── api/            .NET 10 · Minimal API · vertical slices
│   ├── src/Fsdev.Api/
│   └── tests/Fsdev.Api.Tests/
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
| 23 of the 24 tools | **Regex Tester** | `System.Text.RegularExpressions` genuinely cannot run in a browser |

That table used to be longer. Three tools left it — SQL formatting, JSON → C# and SQL → LINQ. Two of
them were justified by a T-SQL parser this project has no use for (the queries are Oracle); the third
confused printing C# with compiling it. All three are client-side now, and the reasoning is recorded
in [ADR-0001](docs/adr/0001-client-side-by-default.md#revisions) rather than quietly edited away.

Regex stayed, and it is worth seeing why. Paste a balancing group — a construct that matches only
balanced parentheses:

```
^(?<open>\()+(?<-open>\))+(?(open)(?!))$
```

The JavaScript engine refuses to compile it; .NET matches. The tool also flags the quieter
differences, the ones that compile in both and then disagree: `\d` matches Arabic-Indic digits in .NET
but not in JavaScript, and `RegexOptions.IgnoreCase` follows the server culture, so `FILE` and `file`
stop matching under `tr-TR`.

Two things fall out of this for free: **no secret ever reaches the server**, and the site keeps working
when the API is cold or down — tools that need it are marked with an `API` badge.

→ [ADR-0001: Client-side by default](docs/adr/0001-client-side-by-default.md)

### 2. One tool, one folder — on both sides

Twenty-four tools written as twenty-four hand-rolled pages is not an architecture. Every tool is a
self-describing module that registers itself; **routing, search, the home grid and the command palette
are all derived from one registry.**

```
web/src/tools/base64/              api/src/Fsdev.Api/Features/Health/
├── index.ts        definition     └── HealthEndpoint.cs   thin: bind, delegate
├── base64.ts       pure logic
├── base64.test.ts  table-driven   api/src/Fsdev.Api/Features/Regex/
└── Base64Tool.tsx  UI              └── RegexEndpoint.cs    the one real slice
```

The same shape on both sides, for the same reason: **the part worth testing is the part that isn't
framework code.** On the frontend that means a pure function outside React; on the backend an engine
class that never sees `HttpContext`. Backend slices self-register through `IEndpoint`, so `Program.cs`
names no tool — the mirror image of the frontend registry.

Errors are values, not exceptions. Every frontend tool returns
`ToolResult<T> = { ok: true, value: T } | { ok: false, error: ToolErrorKey, detail?: string }` — the
key, not the message, so a pure function never has to know which language the reader speaks. `detail`
carries the part that must not be translated: a parser's `4:12` position, or the engine's own words.
Invalid input is an expected
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
a matching slice under `api/src/Fsdev.Api/Features/` — it self-registers under `/api/v1`.

## Tech stack

**web** — React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router v7 · Vitest
**api** — .NET 10 · Minimal API · xUnit · warnings-as-errors

## Running locally

Everything runs from the repository root — the root `package.json` is a task
runner that forwards into `web/` and `api/`, so there is no directory to
remember.

```bash
npm run install:web   # once
npm run dev           # → http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on :5173 |
| `npm test` | frontend test suite |
| `npm run test:coverage` | coverage, gated at 90% on tool logic |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | typecheck + production build |
| `npm run api` | .NET API on :5106, OpenAPI at `/openapi/v1.json` |
| `npm run api:build` | build the API — warnings are errors |
| `npm run api:test` | backend test suite |
| **`npm run check`** | **typecheck + both test suites — run this before pushing** |

Only the Regex Tester calls the API, and only when you switch it to the .NET
engine. `web/.env.development` already points at `http://localhost:5106`, so
`npm run api` in a second terminal is all it takes. Skip it and the tool says the
.NET engine is unavailable and falls back to JavaScript — the same thing that
happens on static hosting.

## Roadmap

**Shipped — 24 tools, nothing left in a "soon" state.** The ones worth naming, because they do not
exist elsewhere:

| | |
| --- | --- |
| **Mojibake Fixer** | repairs two distinct corruption patterns, including the rarer one where the correct character survives with an orphan lead byte glued to it |
| **RTF → Text** | reads `\ansicpg` so Turkish survives; every naive converter turns `Tanı` into `Taný` |
| **Unicode Inspector** | invisible characters, bidi overrides, NFC/NFD — the bug class nobody can find by eye |
| **IN (…) Builder** | splits past 1000 expressions, because Oracle raises `ORA-01795` |
| **Oracle Error Codes** | 54 codes with the cause, not just the message |
| **Bind Parameters** | turns a logged query plus logged parameters into something you can actually run |
| **SQL Diff** | word-level highlighting, with optional formatting first so indentation changes are not noise |
| **Turkish Test Data** | TCKN and IBAN that pass their real checksums |
| **Regex Tester** | the real .NET engine next to JavaScript, and a list of where the two silently disagree |
| **Cron Expression** | gets the rule most tools get wrong: when day-of-month *and* day-of-week are both restricted, classic cron fires if **either** matches |
| **JSON → C# / TS** | one sample, two languages — merges every element of an array before deciding a type, so an optional field is not missed |
| **Hash & HMAC** | SHA from WebCrypto; CRC32 and MD5 hand-written because WebCrypto refuses MD5, verified against the RFC 1321 and RFC 2202 vectors |

The rest are the everyday set: Base64, Case Converter, CSV → JSON/SQL, XML ⇄ JSON, SQL Formatter,
JSON/XML/HTML/CSS formatter, SQL → LINQ, Epoch, JWT, UUID, HTTP status, Colour & WCAG.

**Next** — nothing is half-built. The next additions would be Oracle-specific rather than generic:
DDL → EF Core entity, and a DFM inspector for the Delphi side.

## Security notes

The API is a public endpoint that parses hostile input, so it is treated as one:

- Per-IP rate limiting (60 req/min) and request size limits on every endpoint
- Regex evaluation is **ReDoS-bounded**: a 250 ms `matchTimeout`, a 2 000-character pattern cap, a
  100 000-character input cap and a 500-match ceiling. `^(a+)+$` against 40 `a`s returns a timeout
  message instead of pinning a worker — there is a test for exactly that
- XML is handled in the browser; if it ever moves server-side, `DtdProcessing.Prohibit` and a null
  `XmlResolver` are mandatory (**XXE**)
- CORS is an explicit origin allow-list, empty by default
- No user input is ever logged

## License

MIT © Furkan Sabuncu
