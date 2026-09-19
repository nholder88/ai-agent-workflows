# Pack Composition

## Purpose and Audience

This Composition defines how this Pack (agents, skills, and templates) integrates with Matt skills (decide/plan/TDD) and optional Loop hosts such as pocketDev_Autocode. Adopters gain one documented end-to-end path that prevents stepping on each other: Pack context first, Matt decide on that context, TDD delivery, and Pack review against standards and context.

**Audience:** Pack adopters, Loop-host authors, and maintainers who need clarity on ownership boundaries and handoff points between systems.

## Default Path (Context-First)

**Context kit (Pack)** → **Matt decide** (wayfinder when foggy; grill-with-docs; to-spec; to-tickets) → **Pack delivery** (OpenSpec propose/apply + specialists) with **Matt /tdd** → **Pack gates** (UI/test/review against standards + context)

Pack builds project truth first (or on demand): the system-reconstruction eleven-file set plus ontologies after domain and data-model work. Matt grilling, wayfinding, and tickets consume that context so language stays sharp for stakeholders. Matt /tdd delivers the implementation method. Pack gates review against Pack agent standards and the built Context kit — not guessing.

## Prerequisites

- **Matt skills** are an external dependency for adopters. This Pack does not vendor or overwrite them in v1. Adopters install Matt skills separately (ask-matt, wayfinder, grilling, to-spec, implement, tdd, etc.).
- **Pack install**: Follow the root README installation instructions to deploy this Pack's agents, skills, and templates into your IDE.

## Core Contracts

- **[Demarcation](./composition-demarcation.md)**: Stage ownership table (context-first), named handoffs, TDD delivery method, Caveman (Loop-host only), orchestrator role, and links to research
- **[Loop-host Seam contract](./composition-seam.md)**: Context-pack invoke fields, usage records, and integration requirements for Loop hosts plugging into the Pack

## Handoff Cheat-Sheet

1. **Pack → Matt**: Context kit complete (system-reconstruction + ontologies) → Matt grilling/wayfinder consumes it
2. **Matt → Pack**: ready-for-agent tickets → Pack delivery (OpenSpec/apply + specialists) begins
3. **Matt /tdd → Pack**: Implementation complete → Pack UI/test/code-review gates apply
4. **Pack → Loop host** (optional): Context package with inlined Caveman + TDD obligation → host runners invoke Pack agents
5. **Loop host → Pack** (optional): Usage records (tokens, cache, credits, duration, runner, model, effort, work unit ids) → observability

## Orchestrator Role

The Pack orchestrator remains the Pack delivery controller for post-ready-for-agent stages and the keeper of early context stages (documentation preflight / reverse-engineer / Context kit). It does not present itself as the default Matt fog/grill router — Matt owns interactive decide. The orchestrator name remains as-is for now (rename deferred).

## Optional Evidence

Spine research comparing Matt skills vs Pack skills is available for maintainers and adopters who want comparison facts. This is not required reading for adopters following the default path.

- Research findings: (To be linked when Design/research-spine-matt-vs-pack.md exists or research branch is merged)
- Map decisions: [Compose Pack + Matt skills + loop-host seams](https://github.com/nholder88/ai-agent-workflows/issues/14)
- Context-first revision: [Revise Demarcation: Pack context-first before Matt decide](https://github.com/nholder88/ai-agent-workflows/issues/37)

## What Implementers Should Do Next

1. Read [Demarcation](./composition-demarcation.md) to understand stage ownership and handoff points
2. Consult root [CONTEXT.md](../CONTEXT.md) for shared vocabulary (Pack, Matt skills, Loop host, Context kit, Ontology, Demarcation, Seam contract, Handoff point)
3. Review the Loop-host Seam contract (when available) if building or integrating a Loop host
4. Follow the default path: build or trigger Context kit, then engage Matt skills for decide work, then proceed to Pack delivery with /tdd

## Sources

- Parent spec: [Pack Composition — context-first with Matt skills and Loop-host seam](https://github.com/nholder88/ai-agent-workflows/issues/38)
- Map: [Compose Pack + Matt skills + loop-host seams](https://github.com/nholder88/ai-agent-workflows/issues/14)
- Context-first decision: [Revise Demarcation: Pack context-first before Matt decide](https://github.com/nholder88/ai-agent-workflows/issues/37)
