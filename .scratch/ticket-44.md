## Parent

[Spec: Pack Composition — context-first with Matt skills and Loop-host seam](https://github.com/nholder88/ai-agent-workflows/issues/38)

## What to build

A parity-style Composition contract check (with tests) fails if Design contracts drift, README loses the Composition link, or orchestrator loses Stage 0.5 / reverse-engineer / context language — locking the agreed seams.

## Acceptance criteria

- [ ] Validator asserts Design Composition set exists with required headings/phrases for context-first Demarcation and Seam usage fields (including cache tokens and credits-or-null)
- [ ] Validator asserts root README links the Composition index
- [ ] Validator asserts orchestrator still names Stage 0.5 / reverse-engineer / context and does not claim default Matt fog/grill ownership
- [ ] Tests cover happy path plus negatives: missing Design file, missing required heading, README without link, orchestrator missing context-stage language
- [ ] Pattern follows existing tools test style (parity validator prior art); npm script or documented command to run it

## Blocked by

- [Composition: Index doc + README entry](https://github.com/nholder88/ai-agent-workflows/issues/41)
- [Composition: Align orchestrator + clear stale workflow-orchestration refs](https://github.com/nholder88/ai-agent-workflows/issues/42)
- [Composition: Ontology artifact in system-reconstruction](https://github.com/nholder88/ai-agent-workflows/issues/43)
