# Shared evidence and handoff

Maintain a concise task-local fact ledger rather than rescanning unchanged repositories in each phase. Use existing project records when suitable; do not create permanent audit artifacts unnecessarily.

Record repository/path/role, instructions, branch, baseline revision, dirty state, submodule gitlink and checked-out SHA, public contracts and consumers. For a finding record source location, observed/expected behavior, baseline reproduction, priority, compatible remedy and validation result. Never include credentials or customer data.

At phase handoff record changed contracts, actual implemented behavior, affected files, validation commands/results, baseline failures and remaining issues. Invalidate only facts affected by new changes. A docs defect revealing a product bug returns to code only for that defect; a closeout failure returns to its owning phase. Re-run checks affected by the correction. Stop dependent work when required contracts or environment are unavailable and report it accurately; complete independent authorized work.

Completion requires no newly introduced unresolved regression, accurate docs for implemented behavior and explicit remaining limits. Distinguish implemented, committed, merged, released, deployed and adopted by consumers using evidence for each state. Existing session authorization governs delivery; this Skill adds no blanket permission for external mutations.
