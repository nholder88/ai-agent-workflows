# AI Agent Workflows Pack

Composition of this Pack with Matt skills and optional Loop hosts.

## Language

**Pack**:
This repository's installable set of agents, skills, and templates.
_Avoid_: repo, toolkit (when referring to the shipped unit)

**Matt skills**:
The Matt Pocock skill set (ask-matt, wayfinder, grilling, to-spec, implement, tdd, etc.), treated as an external dependency for adopters.
_Avoid_: Claude skills (ambiguous)

**Loop host**:
An optional autonomous runner that invokes the Pack across coding runs with observability. pocketDev_Autocode is the reference host, not a required dependency.
_Avoid_: RAL (when a precise term is needed use Loop host)

**Composition**:
The locked strategy for when Pack, Matt skills, and a Loop host own a phase, and how they hand off.
_Avoid_: integration, merge (unless meaning git merge)

**Context kit**:
Pack-owned project truth built first (or on demand): the system-reconstruction eleven-file set plus ontologies after domain and data-model work.
_Avoid_: docs only, glossary only

**Ontology**:
A model of how the nouns and products in the problem relate in the real world the application represents.
_Avoid_: glossary (a glossary names terms; an ontology states relationships)

**Demarcation**:
The ownership boundary between systems for a given pipeline stage.
_Avoid_: split (when referring to the boundary itself)

**Seam contract**:
What a Loop host must call, receive, and log to plug into the Pack without requiring a specific host.
_Avoid_: API (unless a concrete HTTP/RPC surface is meant)

**Handoff point**:
A named place where one system finishes and yields into another.
_Avoid_: bridge, transition
