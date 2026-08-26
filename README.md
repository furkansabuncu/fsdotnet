# fsdotnet

**Developer toolbox for the .NET ecosystem.** Fast, private, keyboard-first.

[![web](https://github.com/furkansabuncu/fsdotnet/actions/workflows/web.yml/badge.svg)](https://github.com/furkansabuncu/fsdotnet/actions/workflows/web.yml)
[![api](https://github.com/furkansabuncu/fsdotnet/actions/workflows/api.yml/badge.svg)](https://github.com/furkansabuncu/fsdotnet/actions/workflows/api.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> 🔗 **Live:** <https://furkansabuncu.github.io/fsdotnet/> · Press <kbd>Ctrl</kbd>+<kbd>K</kbd> anywhere to jump to a tool.

---

## Why another dev-tools site?

There are excellent general-purpose toolboxes already ([CyberChef](https://gchq.github.io/CyberChef/),
[it-tools](https://it-tools.tech/)). fsdotnet is not trying to be a smaller copy of them — it targets a gap
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
fsdotnet/
├── web/            React 19 · TypeScript · Vite · Tailwind CSS
│   └── scripts/    sitemap, prerender, and the Open Graph card
├── api/            .NET 10 · Minimal API · vertical slices
│   ├── src/Fsdotnet.Api/
│   └── tests/Fsdotnet.Api.Tests/
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
| 33 of the 34 tools | **Regex Tester** | `System.Text.RegularExpressions` genuinely cannot run in a browser |

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

Thirty-four tools written as thirty-four hand-rolled pages is not an architecture. Every tool is a
self-describing module that registers itself; **routing, search, the home grid and the command palette
are all derived from one registry.**

```
web/src/tools/base64/              api/src/Fsdotnet.Api/Features/Health/
├── index.ts        definition     └── HealthEndpoint.cs   thin: bind, delegate
├── base64.ts       pure logic
├── base64.test.ts  table-driven   api/src/Fsdotnet.Api/Features/Regex/
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

Three of the tools are the same machine with a different rule table — SQL Fixer, the Oracle 11g LINQ
lint and the Turkish culture lint all share `src/lint/`: a scanner per language, a `Finding` shape, a
`patternRule` factory and one conflict-aware `applyFixes`. The findings UI is shared too, so a new
linter is a rule table and a dictionary section — not a new page. The third one took an afternoon
because of it.

The SQL half of that folder is shared further: the scanner and the clause splitter also back
`minifySql`, `sqlToLinq`, the DDL scaffolder and the Delphi extractor, which used to carry their own
copies. One of those copies did not know what a comment was, so a `-- from x` line was being read as
a clause.

→ [ADR-0002: Single API, vertical slices](docs/adr/0002-single-api-vertical-slices.md) ·
[ADR-0003: Tool registry](docs/adr/0003-tool-registry.md)

### 3. Every page has an address, in both languages

Language used to live in `localStorage`. That is invisible to a crawler: it arrives once, in one
language, and never sees the other dictionary — so half the site was unreachable from search, and a
Turkish page could not be shared, because the recipient got English.

Every page now answers at `/en/…` and `/tr/…`, switching language is a navigation rather than a
state change, and each route carries its own `<title>`, description, canonical URL and reciprocal
`hreflang` links. React 19 hoists metadata rendered inside components, so no helmet library is
involved.

`sitemap.xml` and `robots.txt` are generated from the catalogue at build time — 70 addresses that
would otherwise be maintained by hand and quietly fall behind.

The build then renders all 70 to static HTML. That is not an optimisation: **share crawlers do not run
JavaScript**, so without it the Open Graph cards were invisible to exactly the clients they exist for.
Lazily loaded tools are deliberately not awaited — the crawler needs the heading, the description and
the guide text, all of which live outside the lazy boundary, not the interactive widget.

Every tool page also carries a guide — the prose under the tool. That is what a search result
actually matches: "Base64 Encoder" is not a query, "ORA-00979 not a group by expression" is. Twenty-seven
of the thirty-four have one, in both languages. The other seven do not, on purpose: there is nothing
non-obvious to say about a Base64 encoder, and a thin page written to fill a slot drags down the ones
that are not thin.

Two details are worth naming because they were wrong first. Canonical URLs now end in a slash: GitHub
Pages answers `/en/t/base64` with a **301** to `/en/t/base64/`, so the slashless form meant every
canonical tag and every sitemap entry pointed at a redirect — the exact ambiguity canonical exists to
remove. And the prerenderer writes `lang` per page; the client set it in an effect, which is too late
for the crawlers that do not run JavaScript, so every Turkish page claimed to be English. Each tool
page also emits JSON-LD built from what is actually on the page — `SoftwareApplication`, a breadcrumb,
and `FAQPage` only where a visible guide really has questions.

## Adding a tool

Frontend:

1. `my-tool.ts` — the pure function, returning `ToolResult<T>`
2. `my-tool.test.ts` — table-driven cases, including the ugly inputs
3. `MyTool.tsx` — UI, usually just `<ConverterShell>` plus a toolbar
4. `index.ts` — the `ToolDefinition`
5. One line in `registry.ts`, and its id in `TOOL_IDS`
6. A description in both dictionaries — the compiler will not let you skip one

Routing, search, the palette and the home page pick it up automatically. If the tool needs the API, add
a matching slice under `api/src/Fsdotnet.Api/Features/` — it self-registers under `/api/v1`.

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
| `npm run build` | sitemap + typecheck + build + prerender |
| `npm run sitemap` | regenerate `sitemap.xml` and `robots.txt` |
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

**Shipped — 34 tools, nothing left in a "soon" state.** The ones worth naming, because they do not
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
| **Date Format Converter** | Oracle ⇄ .NET ⇄ dayjs ⇄ Delphi patterns, parsed into named fields rather than mapped dialect-to-dialect — so it can say `HH` means 12-hour in Oracle, `mm` means the month in Delphi, and `/` is a culture placeholder that prints a dot under `tr-TR` |
| **Turkish Culture Lint** | the code that only breaks on a Turkish server: `"file".ToUpper()` is `FİLE`, `double.Parse("3.14")` reads 314, and `/` in a .NET format string prints a dot. Covers the ground of CA1305, CA1307 and CA1310 without configuring an analyzer |
| **Delphi PAS → SQL** | pulls the SQL out of a `.pas` unit: reassembles the string concatenation, restores the space lost at the seam, and lists bind variables separately from values interpolated into the text |
| **DDL → EF Core Entity** | splits `NUMBER` by its real capacity — 4 digits `short`, 9 `int`, 18 `long`, above that `decimal` — because `NUMBER(10)` does not fit in an `int` and the overflow arrives with production data |
| **Procedure → ODP.NET** | the ref cursor skeleton with the four traps closed: `BindByName`, the `Size` an OUT `VARCHAR2` needs, reading the cursor after `ExecuteNonQuery`, and not narrowing `NUMBER` by accident |
| **GUID ⇄ RAW(16)** | `Guid.ToByteArray()` reverses the first three fields, so the same GUID written two ways is two different keys and the row is never found again |
| **Oracle 11g LINQ Lint** | the EF Core patterns that compile and then fail at runtime on 11g: `AnyAsync`, a bool produced inside a `Select` (`ORA-00904: "FALSE"`), `Query()` inside a lambda (CS0854), `Skip`/`Take`. It knows where to stay quiet — `Any(…)` inside a `Where` is valid and is not reported |
| **Delphi PAS → SQL** | pulls the SQL out of a `.pas` unit: reassembles the string concatenation, restores the space lost at the seam, and lists bind variables separately from values interpolated into the text |
| **Oracle Auto-Increment** | sequence + `BEFORE INSERT` trigger for 11g, identity column for 12c — with the `WHEN (NEW.x IS NULL)` clause everyone forgets, and a check on the generated names against the 30-character limit |
| **SQL Fixer** | a linter with auto-fixes for queries that will not run: invisible characters, curly quotes, paste debris, T-SQL syntax on Oracle, `TOP` and `OFFSET/FETCH` rewritten as `ROWNUM` — and it unwraps a query pasted straight out of a `.pas` or `.cs` file. Every fix is listed and applied individually, because a query that errors is a loud failure and a quietly "fixed" one is a silent one |

The rest are the everyday set: Base64, Case Converter, CSV → JSON/SQL, XML ⇄ JSON, SQL Formatter,
JSON/XML/HTML/CSS formatter, SQL → LINQ, Epoch, JWT, UUID and HTTP status.

**Next** — nothing is half-built. Two things are deliberately not done. A DFM inspector for the
Delphi side is the largest remaining piece and has not been started. And the LINQ lint reads text
rather than a syntax tree, which is why it is written to under-report; running the same rules against
a Roslyn `SyntaxTree` in the API would make it exact, and is the one place left where the backend
would genuinely earn a second slice.

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
