# Composition Demarcation

## Purpose

This Demarcation defines ownership boundaries between the Pack (agents, skills, templates), Matt skills (decide/plan/TDD), and optional Loop hosts for each pipeline stage. Adopters can follow this alone to explain who owns context, decide, deliver, and review — and where systems hand off — without opening Wayfinder tickets or guessing from implementation details.

## Stage Ownership (Context-First)

| Stage | Owner | Responsibility | Output |
|-------|-------|----------------|--------|
| **0.5 Context Kit** | Pack | Build system-reconstruction eleven-file set (00-10) + ontologies after domain/data-model work. Start or on demand. | docs/system-spec/ reconstruction set + ontology artifact |
| **1 Fog / Grill** | Matt | Interactive grilling, wayfinding, domain modeling. Consumes Pack Context kit. | Grill docs, domain clarity, map decisions |
| **2 Decide / Spec** | Matt | to-spec, to-tickets. Produces ready-for-agent tickets from grill docs. | Tickets with AC, planning delta, priors |
| **3 Deliver** | Pack + Matt /tdd | Pack OpenSpec (propose/apply) + specialists. Matt /tdd for implementation method. | Working code, passing tests |
| **4 Gates** | Pack | UI/test/code-review agents apply Pack standards + Context kit. | Review outcomes, merge or revision requests |

**Key principle:** Pack builds context first (or on demand). Matt decides on that context. Matt /tdd delivers implementation method. Pack gates review against Pack standards and that context — not guessing.

## Named Handoffs

### H1: Pack Context Kit → Matt Grilling

**When:** Project start (new projects) or on demand (brownfield reconstruction)  
**Trigger:** Missing system-reconstruction docs or adopter requests context refresh  
**Handoff:** Pack system-reverse-engineer skill completes docs/system-spec/ files 00-10 plus ontology (after domain/data-model work)  
**Next:** Matt grilling/wayfinding/domain-modeling consumes the Context kit to sharpen language and produce grill docs

### H2: Matt Grill Docs → Pack Assumption-Review (Optional)

**When:** Grill docs complete, adopter wants Pack validation  
**Trigger:** Adopter invokes Pack assumption-review agent  
**Handoff:** Matt grill docs + Context kit  
**Next:** Pack validates grill docs against Context kit, flags contradictions or gaps  
**Note:** Optional — not mandatory in the default path

### H3: Matt Decide → Pack Delivery

**When:** Matt to-spec / to-tickets completes  
**Trigger:** Tickets marked ready-for-agent with AC, planning delta, priors  
**Handoff:** ready-for-agent tickets + Context kit  
**Next:** Pack OpenSpec propose/apply + specialists begin implementation (with Matt /tdd for delivery method)

### H4: Matt /tdd → Pack Gates

**When:** Implementation complete, tests passing  
**Trigger:** Matt /tdd finishes, implementer signals ready for review  
**Handoff:** Code changes, test evidence, ticket references  
**Next:** Pack UI/test/code-review agents apply Pack standards + Context kit

### H5: Pack Delivery → Loop Host (Optional)

**When:** Loop host invokes Pack for autonomous runs  
**Trigger:** Host sends context package with work unit ids, effort, Caveman, TDD obligation  
**Handoff:** Context package (instructions, AC, planning delta, priors, inlined Caveman + TDD)  
**Next:** Pack agents execute, return usage records (tokens, cache, credits, duration, runner, model, effort, work unit ids)

## TDD (Matt /tdd)

**Owner:** Matt  
**Method:** Matt /tdd skill  
**Contract:** Red → green → refactor. Write or extend a failing functional test BEFORE production code. Minimum per new behavior: happy path, one negative case, one edge case.  
**Pack role:** Enforces TDD obligation in delivery stage. Does not fork or vendor TDD itself.

## Caveman (Loop-Host Only)

**Owner:** Loop hosts (when present)  
**Method:** Inlined in context package for loop runs  
**Contract:** Thrift obligations for autonomous runs (simplicity, no premature abstraction, conservative dependencies).  
**Pack role:** Documents Caveman as a Loop-host concern. Pack agents do not enforce Caveman in interactive mode.  
**Note:** Caveman applies to loop runs, not interactive Matt decide or Pack delivery sessions.

## Orchestrator Note

The Pack orchestrator remains the Pack delivery controller for post-ready-for-agent stages (Stage 3+) and the keeper of early context stages (Stage 0.5 / reverse-engineer / Context kit). It does not present itself as the default Matt fog/grill router — Matt owns interactive decide (Stage 1-2). Orchestrator rename (e.g., pack-delivery-orchestrator) is deferred; current name stays as-is.

**Critical:** Stage 0.5 / reverse-engineer / Context kit must remain first-class on the orchestrator path. Do not strip early context as a "pre-decide skip."

## Context-First Flow (Full Path)

1. **Pack Context Kit (Stage 0.5):** Build or refresh system-reconstruction + ontologies → H1
2. **Matt Grilling (Stage 1):** Consume Context kit, produce grill docs → (Optional H2) → H3
3. **Matt Decide (Stage 2):** to-spec / to-tickets → ready-for-agent tickets → H3
4. **Pack Delivery (Stage 3):** OpenSpec propose/apply + specialists + Matt /tdd → H4
5. **Pack Gates (Stage 4):** UI/test/code-review against Pack standards + Context kit → merge or revision
6. **(Optional) Loop Host:** Context package + inlined Caveman + TDD → H5 → usage records

## Links to Research and Decisions

- **Spine research** (Matt vs Pack comparison): To be linked when Design/research-spine-matt-vs-pack.md exists or research branch is merged
- **Loop-host Seam contract**: [Loop-host Seam contract](./composition-seam.md)
- **Map decisions**: [Compose Pack + Matt skills + loop-host seams](https://github.com/nholder88/ai-agent-workflows/issues/14)
- **Context-first revision**: [Revise Demarcation: Pack context-first before Matt decide](https://github.com/nholder88/ai-agent-workflows/issues/37)

## Decisions and Sources

This Demarcation encodes the context-first decision from issue #37, superseding earlier "trim all pre-H3 orchestrator" readings of #17 and #18. Pack context building (system-reconstruction + ontologies) runs at project start or on demand **before** Matt grilling/decide, and Matt then uses that context. TDD implement + Pack code review judge against Pack agent standards and that context.

**Sources:**
- Parent spec: [Pack Composition — context-first with Matt skills and Loop-host seam](https://github.com/nholder88/ai-agent-workflows/issues/38)
- Map: [Compose Pack + Matt skills + loop-host seams](https://github.com/nholder88/ai-agent-workflows/issues/14)
- Critical revision: [Revise Demarcation: Pack context-first before Matt decide](https://github.com/nholder88/ai-agent-workflows/issues/37)
