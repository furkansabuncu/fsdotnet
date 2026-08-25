# ADR-0002: A single API, organised as vertical slices

**Status:** Accepted · **Date:** 2026-08-19

## Context

Following ADR-0001, only a handful of tools need a backend — around six endpoints, all stateless, with
no shared domain model and no database.

Two tempting options were rejected.

**Microservices.** Splitting six stateless endpoints across independently deployed services would
multiply the operational surface — deployment, service discovery, a gateway, distributed tracing — to
solve scaling and team-boundary problems this project does not have. Applied here it would be
architecture for its own sake, which is worse than no architecture at all.

**Classic layering** (`Domain` / `Application` / `Infrastructure` / `Api`). There is no domain here:
no entities, no aggregates, no persistence. Layers would produce four projects of pass-through code
wrapping what is fundamentally a set of pure functions.

## Decision

One ASP.NET Core Minimal API on **.NET 10**, organised by **vertical slice** — one folder per tool,
holding everything that tool needs:

```
api/src/Fsdotnet.Api/Features/DotnetRegex/
├── DotnetRegexEndpoint.cs   ── thin: bind, validate, delegate. No logic.
├── DotnetRegexEngine.cs     ── all the logic, plain class, no HTTP types
└── DotnetRegexModels.cs     ── request/response records

api/tests/Fsdotnet.Api.Tests/Features/DotnetRegex/
└── DotnetRegexEngineTests.cs
```

Three conventions hold it together:

1. **Routes are versioned:** everything is mapped under `/api/v1`, owned by `EndpointExtensions`
   rather than repeated per endpoint.
2. **Endpoints are thin; engines hold the logic.** An `…Engine` takes and returns plain types and
   knows nothing about `HttpContext`. This keeps the interesting code testable without spinning up a
   web host, and mirrors the frontend rule that a tool's logic is a pure function outside React
   (ADR-0003). It is also a pattern the author has run in production, and it earns its place here for
   the same reason: the part worth testing is the part that isn't HTTP.
3. **Endpoints self-register.** Each slice implements `IEndpoint`; `AddEndpoints()` discovers
   implementations by reflection, so `Program.cs` never names a tool. This is the backend twin of the
   frontend's tool registry.

Cross-cutting concerns — rate limiting, request size limits, CORS, the RFC 9457 `ProblemDetails` error
shape — live in the composition root, never inside a slice.

## Consequences

**Good.** Adding a tool touches exactly one new folder on each side. A reader can understand a single
tool without holding the rest of the system in their head. Engines are unit-testable in isolation;
only the HTTP contract needs an integration test. The frontend/backend symmetry makes the whole project
explainable in one sentence: *one tool, one folder, on both sides.*

**Bad.** Shared helpers have no obvious home until a second slice needs one; the rule is to duplicate
once and extract on the third use, rather than build a `Common` project up front. Reflection-based
endpoint discovery is one indirection away from an explicit list — the "unknown route returns 404" test
exists precisely because a wrong filter there would silently register nothing. If a single tool ever
needs genuinely independent scaling it has to be extracted, which is unlikely, and the slice boundary
makes that mechanical.
