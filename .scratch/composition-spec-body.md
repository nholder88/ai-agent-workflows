## Problem Statement

Pack adopters have three overlapping toolkits that can step on each other: this Pack (agents/skills/templates), Matt skills (decide/plan/TDD), and optional Loop hosts such as pocketDev_Autocode. Without a clear Composition, PocketDev or a full Pack orchestrator can overwrite or replace Matt's decide path, Matt's glossary alone is treated as enough "language," and early Pack context building (the system-reconstruction eleven-file set) gets trimmed away. Adopters need one documented end-to-end path: build Pack context first, decide with Matt on that context, deliver with TDD, review against Pack standards and that context — plus a host-agnostic Loop-host seam that does not invent a second planning system.

## Solution

Ship a pack-adopter Composition in Design (index + Demarcation + Loop-host Seam contract), restore/keep root CONTEXT.md vocabulary, update README to point at the Composition, keep Pack early context (system-reconstruction + ontologies) first-class on the orchestrator path, document Matt as the interactive decide layer that consumes that context, require Matt /tdd for delivery method, keep Pack post-decide delivery and review gates, and add a small Composition contract validator (parity-validator style) that locks the Design headings, README pointers, and orchestrator context-stage presence. PocketDev remains reference-only on this effort; bidirectional wiring stays on the sibling map.

## User Stories

1. As a pack adopter, I want a single Composition index in Design, so that I know the default path without reading Wayfinder tickets.
2. As a pack adopter, I want Demarcation written in plain stage ownership, so that I know who owns context, decide, deliver, and review.
3. As a pack adopter, I want Pack context building first (or on demand), so that grilling and tickets use real project truth.
4. As a pack adopter, I want the system-reconstruction eleven-file set retained, so that tech-agnostic overview, APIs, data model, tech analysis, improvements, and unknowns stay standard.
5. As a pack adopter, I want ontologies after domain/data-model work, so that nouns and products relate in a real-world model — not just a glossary.
6. As a pack adopter, I want Matt grilling/wayfinder/to-spec/to-tickets to consume Pack context, so that language stays sharp for stakeholders.
7. As a pack adopter, I want Matt skills documented as an external dependency, so that the Pack does not vendor or overwrite them in v1.
8. As a pack adopter, I want fog/grill routing owned by Matt, so that the Pack orchestrator is not a second decide brain.
9. As a pack adopter, I want Pack orchestrator to keep Stage 0.5 / reverse-engineer / context kit, so that early context is not stripped as "pre-decide skip."
10. As a pack adopter, I want Pack delivery after ready-for-agent (OpenSpec/apply/specialists), so that implementers stay Pack-owned.
11. As a pack adopter, I want Matt /tdd as the required implement method, so that delivery stays test-first without forking TDD into the Pack.
12. As a pack adopter, I want Pack UI/test/code-review gates after implement, so that quality checks use Pack agent standards.
13. As a pack adopter, I want code review to use Pack standards and the built Context kit, so that review is not guessing.
14. As a pack adopter, I want README to link the Composition index (and contracts), so that discovery does not depend on issue history.
15. As a Loop-host author, I want a Seam contract doc, so that I can plug into the Pack without copying PocketDev internals.
16. As a Loop-host author, I want context-pack invoke fields documented, so that runners get instructions, AC, planning delta, and priors consistently.
17. As a Loop-host author, I want usage records to require tokens in/out, cache read/write (0 if none), credits (or null), duration, runner, model, effort, and work unit ids, so that spend stays observable.
18. As a Loop-host author, I want Caveman and TDD obligations inlined in the context package for loops, so that thrift/TDD do not depend on skill-invoke quirks.
19. As a Loop-host author, I want Pack agent/skill ids optional on invoke, so that hosts are not forced to name Pack agents every run.
20. As a PocketDev user, I want PocketDev treated as reference host only in this Pack change, so that Pack stays usable without Autocode.
21. As a maintainer, I want stale workflow-orchestration references fixed, so that the skill map matches reality.
22. As a maintainer, I want a Composition contract validator, so that Design headings and README pointers cannot silently drift.
23. As a maintainer, I want orchestrator assertions in that validator, so that context Stage 0.5 cannot be deleted by accident.
24. As a maintainer, I want spine research linked as evidence (not required adopter reading), so that comparison facts remain available.
25. As a Wayfinder user, I want this spec to encode map #14 + #37, so that /to-tickets can slice without reopening Demarcation.
26. As a new-project adopter, I want context kit at start, so that ontologies and reconstruction docs exist before heavy decide work.
27. As a brownfield adopter, I want context kit on demand, so that missing docs trigger reverse-engineer without blocking forever.
28. As a stakeholder-facing builder, I want domain language plus ontology, so that conversations do not invent nonsense terms.
29. As an implementer agent, I want tickets plus Context kit, so that AC and domain relationships are both visible.
30. As a code-review agent, I want agent standards plus Context kit, so that review criteria are explicit.
31. As a pack adopter skipping fog, I want precise/trivial work to skip Matt fog tools, so that small tasks stay cheap (H8).
32. As a pack adopter, I want optional Pack assumption-review after grill docs, so that H2 remains optional not mandatory.
33. As a future installer user, I want Matt installer pull deferred, so that v1 Composition does not block on packaging Matt skills.
34. As a map reader, I want ontology file shape named in implementation decisions, so that /to-tickets can create the artifact without re-grilling.

## Implementation Decisions

- Write three Design docs as the adopter surface: composition.md (index), composition-demarcation.md (ownership + handoffs + context-first flow), loop-host-seam-contract.md (invoke + usage fields). Section outlines locked on Wayfinder ticket #20; bodies must reflect #37 context-first revision (not the older "trim all pre-H3" reading).
- Keep root CONTEXT.md with Pack / Matt skills / Loop host / Composition / Context kit / Ontology / Demarcation / Seam contract / Handoff point vocabulary.
- README: add a Composition section linking the Design index (deep-links to the two contracts allowed).
- Context kit: Pack-owned. Includes system-reconstruction files 00-10 under docs/system-spec/ (or user path) via system-reverse-engineer / orchestrator Stage 0.5; plus an ontology artifact produced after domain/data-model work.
- Ontology artifact (v1 decision for implementers): add docs/system-spec/05b-ontology.md (or equivalent numbered sibling next to 05-data-model.md) describing entities, relationships, and forbidden synonym drift; link it from 01-system-overview.md and 05-data-model.md. Extend system-reconstruction skill standards to require or optionally emit this file when building context for new or reconstructed projects.
- Default interactive path: Context kit (Pack) → Matt decide (wayfinder when foggy; grill-with-docs; to-spec; to-tickets) → Pack delivery (OpenSpec propose/apply + specialists) with Matt /tdd → Pack gates (UI/test/review).
- Orchestrator: remains Pack delivery controller for post-ready-for-agent stages; must keep documentation preflight / reverse-engineer / context kit early stages; must not present itself as the default Matt fog/grill router. Do not strip Stage 0.5. Rename to pack-delivery-orchestrator stays deferred.
- Fix stale workflow-orchestration references in skill map / implementation-routing notes; do not resurrect a parallel workflow-orchestration skill.
- Matt skills: documented external dependency only in v1 (no vendoring).
- Loop-host Seam v1: context-pack invoke; required resolve fields include AGENT_WORKFLOWS_PATH, work unit ids, effort, repo path, context package, inlined Caveman, TDD obligation; required usage fields include tokens_in/out, tokens_cache_read/write (0 if none), credits (or null), duration_seconds, runner_id, resolved_model, echoed work unit ids + effort. Pack agent/skill id optional.
- Composition contract validator: one check module in the existing tools/test style (parity validator as prior art) asserting (1) Design files exist with locked headings/required phrases for context-first + seam fields, (2) README links Design/composition.md, (3) orchestrator still names Stage 0.5 / reverse-engineer / context and does not claim default ownership of Matt fog/grill routing.
- Link spine research (Design/research-spine-matt-vs-pack.md when merged or pointed from research branch) as optional evidence from Demarcation — not required adopter reading.
- No PocketDev application code changes in this spec; sibling map owns bidirectional hookup.

## Testing Decisions

- Good tests assert observable adopter-facing contracts (files present, required section headings/phrases, README links, orchestrator stage text), not private markdown formatting preferences.
- Primary seam: Composition contract validator covering Design set + README pointer + orchestrator context-stage assertions (agreed).
- Prior art: templates/tools/validate-parity.ts and validate-parity.test.ts — mirror that pattern (script + tests) rather than a new framework.
- Modules under test: the new validator and its fixtures/golden heading lists; not PocketDev; not Matt skill trees.
- Negative cases: missing Design file, missing required heading (e.g. Context kit / ontology / cache token fields), README without Composition link, orchestrator missing Stage 0.5 / reverse-engineer language.
- Edge case: credits may be null; cache token fields may be zero — docs/validator phrases must allow that, not require nonzero values.

## Out of Scope

- Implementing PocketDev_Autocode features or bidirectional Pack↔Autocode wiring (sibling map #21).
- Vendoring or forking the full Matt Pocock skill set into the Pack in v1.
- Optional installer path to pull/link Matt skills.
- Renaming orchestrator agent id.
- Specialist-layer overlap map (language/DB/UI/container) beyond noting Stage 4 specialists exist.
- Pack-owned cost-ledger skill as the Seam emit path.
- Requiring named Pack agent on every Loop-host invoke.
- Changing template stack parity matrix behavior except via README/Composition pointers.

## Further Notes

- Source map: https://github.com/nholder88/ai-agent-workflows/issues/14
- Critical revision: https://github.com/nholder88/ai-agent-workflows/issues/37 (supersedes earlier "trim pre-H3 context" reading of #17/#18)
- Related locked tickets: #15 spine research, #16 pocketDev substrate, #19 seam fields, #20 doc outlines
- After this spec: /to-tickets for tracer-bullet implementation slices (Design bodies, README, orchestrator text, system-reconstruction ontology file, validator)
