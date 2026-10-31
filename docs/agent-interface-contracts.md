# Contracts for reliable agent access

An agent-facing operation should let a caller discover its purpose, validate an
input, understand its effects, recover an interrupted call and verify the result.
Keep domain rules in the owning repository. CLI, MCP and HTTP adapters reuse them.
This guide is a design checklist, not an authorization to access data or execute
operations.

## Describe a bounded operation catalogue

Use a versioned catalogue such as `quant.agent_capabilities.v1`. Each operation
identifies its owner, stable ID and contract version, input/output schemas,
invocation, preconditions, side effects, permission category, retry semantics,
synthetic example and limitations. Discovery must work without opening a state
store, starting workers or contacting a provider. Validate examples against the
actual parser and promised output format. Scope a catalogue explicitly; absence
from it does not prove that another operation is unsupported or permitted.

Keep deployment paths and credentials in owner configuration. Cross-repository
catalogues link to provider descriptions rather than copying their complete
operation lists or probing arbitrary directories. Record the version actually
used. A descriptor is metadata, never a permission grant.

## Separate planning, reads and mutations

A bounded preflight reuses strict owner validation and reports both checked and
unchecked conditions. Distinguish declared resource ceilings from performance
estimates, manifest identity from data integrity, and date bounds from contiguous
coverage or historical availability. Missing evidence remains unknown.

If a caller binds execution to a plan digest, hash canonical semantic content and
submit the same validated request object. Re-reading mutable files after checking
a digest breaks that guarantee. Revalidate mutable prerequisites at execution;
a plan does not remove races or replace worker checks.

Provide a pure state read separately from recovery, cancellation or cleanup.
Opening a read connection must not initialize or migrate the database. For
SQLite, test existing WAL databases and missing files; do not use `immutable=1`
for active state. Document any coordination-file effects rather than promising
filesystem-zero writes.

## Make uncertainty and failures actionable

Machine-readable errors need stable codes, conservative retry semantics and
known operation identities. Keep success output separate from error output;
preserve provider error contracts through client adapters. Unknown internal
failures must not leak credentials or become automatic retries. Suggestions do
not authorize actions.

A submission timeout can occur after the write succeeded. Resolve the original
idempotency key before retrying; use the identical content and key for the same
execution. Test conflicting keys, concurrent claims, missing results and modified
artifacts. Verify stored identity and content hashes at result retrieval.

## Preserve handoffs without creating another authority

Keep task IDs, experiment IDs, execution job IDs and artifact references distinct.
An immutable handoff records the question, acceptance criteria, context digest,
previous snapshot, blockers, proposed next action and revalidation requirements.
Use atomic expected-predecessor checks to reject concurrent stale successors.
An old identical registration remains idempotent even after the task head moves.

Expose recorded claims separately from refreshed authoritative evidence. Task
completion, execution success, integrity verification and domain approval are
separate facts. Read-only adapters must not start execution to refresh a handoff.

## Evaluate behavior and report the actual scope

At minimum, use synthetic cross-process acceptance for discovery, planning,
submission, lost-receipt lookup, restart, duplicate prevention, verified retrieval,
input/result tampering and policy rejection. Record source revisions, commands,
exit codes, counts and uncovered conditions. Test provider and consumer revisions
together, and merge providers before consumers.

A fake-provider test verifies a protocol, not model quality. Real model evaluation
needs explicit configuration and budget, observed calls, corrections, duplicate
submissions, recovery effort and evidence errors. Without a model run, report
`not_run`. Neither model agreement nor a synthetic backtest demonstrates economic
validity or grants research promotion.
