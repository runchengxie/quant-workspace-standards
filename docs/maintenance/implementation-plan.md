# Maintenance verification tools

This task implements four approved improvements without changing repository delivery permissions.

1. Add a standard-library-only Python 3.11+ preflight CLI with explicit repository, remote, target and expected GitHub repository inputs. Report local push destinations and outgoing commits. Inventory cleanup candidates without deleting anything; unknown merge, ownership and runtime evidence remains unknown.
2. Add a read-only standards comparison CLI. Compare canonical Markdown sections and list local-only additions separately; exact matches and reordered unchanged rules remain distinguishable from changed shared rules. Never print unrelated local additions or overwrite the local file.
3. Prepare six isolated Git fixtures, publish reusable evaluation requests and a rubric, and run an independent agent evaluation. Record observed outcomes separately from deterministic script tests; do not claim a trigger-rate estimate from a small sample.
4. Publish a bilingual, explicitly simulated walkthrough from request through findings, validation, delivery evidence and cleanup decision. Link the tools, evaluation and walkthrough from the repository and site.

Verification: real disposable Git repositories test push URL overrides, credentials redaction, missing refs, dirty/locked/unmerged cleanup candidates, and local configuration preservation. Test standards changes, local-only sections and missing input. Run fixture preparation twice to confirm refusal to overwrite; compare agent results against private pre-run expectations. CI runs script tests and fixture integrity checks without invoking a paid model. Run existing site and documentation checks before PR delivery.

The agent implements inline. Independent agents are used only for the behavioral evaluation and final review, as required by the applicable skill workflows. Raw evaluation artifacts stay outside the source tree. No hook is installed and no live resource is stopped or removed.
