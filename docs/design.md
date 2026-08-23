# Design system

fsbox is a tool you keep open, not a page you visit. Everything below follows from that:
density over decoration, keyboard over mouse, and colour used to *classify* rather than to
sell.

Values were not invented. The dark scale, semantic colours and command-palette measurements
were read out of the live DOM of nine reference products (Raycast, Linear, jwt.io, regex101,
crontab.guru, Tailwind Play, shadcn/ui, it-tools, transform.tools) and then re-checked for
contrast in both themes.

## The one rule

**Components never use raw palette classes.** No `bg-zinc-900`, no `text-gray-400`, no
`text-sky-500`. Only semantic tokens:

```
bg-bg  bg-surface  bg-surface-2  bg-surface-3
border-border-subtle  border-border-strong
text-fg  text-muted  text-subtle
text-accent  bg-accent  text-accent-fg  bg-accent-bg
text-cat  bg-cat  bg-cat-bg  border-cat
text-success/warning/error/info  (+ matching -bg)
```

Light mode is a second block of the same names in `web/src/index.css`. Any component that
reaches past the tokens breaks it, which is why the rule is absolute rather than a preference.

## Colour

The neutral scale stays almost monochrome — depth comes from hairline borders, not from hue.
All the chroma on the page comes from **category accents**: each of the six categories owns a
hue, and it shows up in the section header, the card's icon chip, the hover ring and the active
segment of a toolbar.

| Category | Dark | Light |
| --- | --- | --- |
| .NET & Data | `#b18cff` | `#7c3aed` |
| Converters | `#4d9fff` | `#0069d9` |
| Formatters | `#59d499` | `#12864f` |
| Security & Tokens | `#ffc533` | `#b45309` |
| Testing & Time | `#ff8ac5` | `#be1a6b` |
| Web & Design | `#4fd1c5` | `#0f766e` |

A component never picks one of these. `categoryVars(category)` sets `--cat` and `--cat-bg` on a
wrapper, and `text-cat` / `bg-cat-bg` read them. Six categories therefore cost one set of
utilities instead of six.

Each accent also has a 15%-alpha companion (`--cat-*-bg`, `#…26`) — on a near-black ground a
flat tint is what makes a badge legible, and picking it per-use leads to drift.

Green is deliberately not the primary accent: it-tools, the closest competitor, is green.

### Contrast

Measured against `--surface`; WCAG AA needs 4.5 for body text and 3.0 for large text and UI.

| Pair | Ratio |
| --- | --- |
| `--fg` on `--bg` | 18.97 |
| `--fg-muted` on `--surface` | 7.13 |
| `--fg-subtle` on `--surface` | 3.67 — 11px meta only, never body text |
| `--accent` on `--surface` | 6.77 |
| `--success` / `--warning` / `--error` on `--surface` | 9.91 / 11.66 / 6.26 |

`--fg-subtle` failing body-text contrast is intentional and constrained: it is only ever used
for 11px metadata and placeholder text.

## Typography

Inter for the interface, JetBrains Mono for anything a user would copy. **16px does not appear
in the interface** — it is the jump between "dense tool" and "content page", and Linear omits it
for the same reason.

| Role | Size / line | Weight |
| --- | --- | --- |
| Page title | 28 / 36 | 600 |
| Section, tool name | 16 / 24 | 500 |
| Base UI | 14 / 20 | 400 |
| Card title | 14 / 20 | 500 |
| Label, group heading | 12 / 16 | 500, uppercase |
| Meta, kbd, status line | 11 / 16 | 400 |
| **Code** | **14 / 24** | 400, mono |

14/24 for code is regex101's ratio — proven at length on a dark ground.

## Density

4px base. Target: regex101's information density with shadcn's finish.

| Element | Size |
| --- | --- |
| Top bar | 48px |
| Tool title strip | 44px |
| Panel header strip | 32px |
| List / grid row | 32px |
| Card padding | 12px 14px |
| Grid and panel gap | 12px |
| Icon | 16px (18px in cards) |

Cards are ~76px, not it-tools' 167px. The difference is entirely the two-line clamped paragraph
that site puts in every card; fsbox descriptions are written to fit one line, so the whole
catalogue fits on one screen.

## Behaviour

**Errors are inline. Modals and toasts are banned.** Invalid input is the normal state of a
converter, not an interruption. On error the output panel is *not* cleared — the last valid
result stays at 40% opacity and the status line turns red, so you can still see what you had.

**Nothing starts empty.** A blank textarea teaches nothing; every tool opens with a realistic
example the user can overwrite. When a panel genuinely is empty, it says what will appear there
rather than showing a grey box.

**Motion is ambient, not reactive.** One slow gradient drift behind the page, 24s, and 120–150ms
colour transitions on hover. No scroll animation. All of it collapses under
`prefers-reduced-motion`.

## References

Every measurement traces back to: [ui.shadcn.com](https://ui.shadcn.com) (token contract,
Command component) · [raycast.com](https://raycast.com) (dark scale, alpha companions) ·
[linear.app](https://linear.app) (type scale, card anatomy) · [jwt.io](https://jwt.io) (syntax
colours, inline validation rows) · [regex101.com](https://regex101.com) (density, error model) ·
[crontab.guru](https://crontab.guru) (example-first empty state) ·
[play.tailwindcss.com](https://play.tailwindcss.com) (split panes).
