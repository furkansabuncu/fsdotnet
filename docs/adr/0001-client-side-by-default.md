# ADR-0001: Client-side by default

**Status:** Accepted · **Date:** 2026-08-19

## Context

fsbox is a collection of developer utilities. The obvious architecture for a project with a .NET
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

- **SQL → LINQ** and **SQL formatting** — needs `Microsoft.SqlServer.TransactSql.ScriptDom`
- **JSON → C# POCO** — needs Roslyn to emit genuinely compilable code
- **Regex, .NET flavour** — `System.Text.RegularExpressions` differs from the JS engine

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
