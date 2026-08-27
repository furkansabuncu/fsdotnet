# ADR-0001: Client-side by default

**Status:** Accepted · **Date:** 2026-08-19

## Context

fsdotnet is a collection of developer utilities. The obvious architecture for a project with a .NET
backend is to expose every tool as an API endpoint. Two things argue against that.

First, most of these tools are **pure functions over a string**. Base64, UUID, epoch conversion,
colour maths and cron parsing do not need a server; routing them through one adds latency, a cold-start
failure mode and hosting cost for zero benefit.

Second, and more seriously: several tools handle **material the user considers secret**. A JWT pasted
into a decoder is a live credential. An HMAC key is a shared secret. Sending those to a server — even
one that promises not to log them — is asking the user to trust an unaudited third party for no reason.

## Decision

A tool runs **in the browser** unless it requires a parser, compiler or runtime that only exists in
.NET. `ToolDefinition.runtime` records this per tool and is enforced by review, not convention.

Server-side is justified only for:

- **Regex, .NET flavour** — `System.Text.RegularExpressions` differs from the JS engine

That list started longer. See *Revisions* below: two of the three original entries did not survive
contact with the actual work.

Anything touching a secret (JWT, hash, HMAC) is **client-only, permanently** — even if a server-side
implementation would be more convenient.

## Consequences

**Good.** No secret leaves the browser, which is a claim we can make honestly and put in the README.
The site keeps working when the API is cold or down; tools needing it carry an `API` badge, turning a
free-tier hosting limitation into visible, honest degradation. Hosting stays near-free because the
frontend is static.

**Bad.** Some logic gets written twice in different flavours (JS regex in the browser, .NET regex on
the server) — this is accepted, since the difference between the two engines is the actual feature.
Client-side tools cannot be rate-limited, so an abusive user only burns their own CPU. Bundle size
needs active management, which is why every tool is lazily imported (see ADR-0003).

## Revisions

The original decision named three server-side tools. Two were wrong, and finding out why was worth
more than the original guess.

**SQL formatting — moved to the client.** The justification was
`Microsoft.SqlServer.TransactSql.ScriptDom`, which parses **T-SQL only**. The queries this project
actually exists to handle are Oracle PL/SQL, so the named parser could not have read them. A
client-side formatter with a real PL/SQL grammar serves the target user; a server-side T-SQL parser
does not. Privacy pointed the same way: a production query carries table names and business rules,
and there is no reason to upload it.

**JSON → C# — moved to the client.** The justification was "Roslyn, to emit genuinely compilable
code". That confused two things. Roslyn is needed to *compile* C#, not to *print* it — and this tool
only prints. Emitting text is something the browser does perfectly well, and requiring a round-trip
bought nothing.

**Regex stands.** You genuinely cannot run `System.Text.RegularExpressions` in a browser, and the
difference between the two engines is the entire point of the tool.

**SQL → LINQ — moved to the client.** Added to the server list on the same reasoning as SQL
formatting, and wrong for the same reason: ScriptDom reads T-SQL, the queries are Oracle. The client
implementation is a clause-level translator that is explicit about being a draft rather than a
compiler. Being honest about producing a starting point turned out to be more useful than a
server round-trip that would have produced a confidently wrong answer.

### The API now carries the regex tool

`POST /api/v1/regex/test` is implemented and tested: a real `Regex` instance, a 250 ms match timeout so catastrophic
backtracking cannot hold a worker, size caps on pattern and input, and a match limit. Its tests cover
balancing groups, conditional patterns, `\A`/`\z`, and the culture-sensitivity of
`RegexOptions.IgnoreCase` — all things the browser engine cannot reproduce.

One design point is worth recording. **A pattern that does not compile returns 200 with
`success: false`, not 400.** Trying a pattern is what the endpoint is *for*, so a rejected pattern is
a result, not a malformed request. Size-limit violations do return 400, because those really are bad
requests. This mirrors the frontend's errors-as-values convention.

The frontend treats the API as **optional**, and on the deployed site that option is currently taken:
`VITE_API_URL` is unset in the GitHub Pages build, so **the endpoint above is not reachable in
production.** The tool reports that the .NET engine is unavailable and falls back to the JavaScript
result. Degradation is visible rather than silent, and the site never breaks because a free-tier
backend went to sleep — or, as here, was never woken up.

That is a deliberate stopping point rather than an unfinished one. Hosting the API would add a
provider, a secret, a cold-start and a CORS origin to keep in sync, in exchange for one tool's second
opinion. Publishing it is a configuration change — set `VITE_API_URL` in the Pages workflow and point
it at a deployment — not a code change, which is the property this ADR was trying to buy.
