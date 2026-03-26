# Skill Library

This folder contains the deduplicated skill library extracted from the custom agents in `VS Code/agents/` and their companion markdown documents.

Design rules for this first pass:

- Skills capture repeatable procedures, checklists, and reusable reference knowledge.
- Skills do not carry agent-only orchestration such as `handoffs`, model selection, color, or tool restrictions.
- The existing agents remain valid; these skills are the reusable workflow layer those agents were implicitly sharing.

Implemented skill families:

- `assumption-review`
- `requirements-clarification`
- `architecture-backlog-planning`
- `system-reconstruction`
- `implementation-routing`
- `implementation-from-spec`
- `frontend-ui-delivery`
- `code-review-gate`
- `ui-ux-review`
- `test-generation`
- `code-documentation`
- `docs-config-authoring`
- `containerization-and-env`
- `data-query-specialists`
- `business-idea-validation`
- `workflow-orchestration`
- `wiki-update-generation`

See `agent-to-skill-map.md` for traceability from the current agent set to these skills.