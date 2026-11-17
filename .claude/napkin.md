# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-11-16] Game rules live in `src/sim/` and must stay pure**
   Do instead: no DOM, `Math.random` or `Date.now` there; pass `Rng` and epoch ms in, and add a Vitest test for every new sim function.
2. **[2026-11-16] Tuning numbers belong in `content/balance.json`**
   Do instead: add a key there and read it through `content.balance`; prove a tuning change with `npm run sim` output.
3. **[2026-11-16] Content must validate before build**
   Do instead: run `npm run validate` after touching `content/`; every species and occurrence needs a `sources` entry.

## Shell & Command Reliability
1. **[2026-11-16] Project path contains a space**
   Do instead: always quote `"/Users/andyingebritson/Documents/Castaway Angler"` in shell commands.

## Domain Behavior Guardrails
1. **[2026-11-16] Toolchain is newer than most examples (Vite 8, Vitest 4, TS 7, Preact 11, zod 4)**
   Do instead: check the installed package's types before using an API from memory.

## User Directives
1. **[2026-11-16] Andy wants continuous building, not a stop per milestone**
   Do instead: keep going past milestone gates; record spec departures in `docs/DECISIONS.md`.
