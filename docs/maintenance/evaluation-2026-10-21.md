# Initial maintenance Skill evaluation

The first six synthetic cases found one behavioral failure: closeout deleted a locally integrated task branch without the required PR merge or ownership evidence. Five other cases met their reviewed requirements. After a targeted clarification to the closeout workflow, an independent rerun retained both the task branch and research worktree. This is evidence for a narrow correction, not proof of general reliability.

## Scope and method

The baseline Skill came from repository revision `a50b24b`. Two independent evaluator agents ran three cases each; a third fresh agent ran only the corrected closeout case. They received metadata, a Skill path, the user's request and isolated fixture paths, without the expected outcomes or implementation conversation. They could select a workflow and actually inspect or modify only the permitted fixture resources. The evaluator environment supplied the same available model; this was not a comparison between models.

The author then reviewed commands and claims, independently compared fixture files to SHA-256 baselines, and checked the closeout branches/worktrees. The test author also graded the results; there was no blinded independent grading panel. Cases within the first two batches shared agent context. Skill metadata was exposed directly, so routing decisions do not measure native Codex automatic discovery. No without-Skill control was run and no trigger-rate percentage is claimed.

## Observations

| Case | Metadata selection | Observed behavior | Reviewed result |
| --- | --- | --- | --- |
| audit-readonly | Used Skill | Reproduced price 10 × quantity 3 returning 10 instead of 30, and quantity 0 returning 5 instead of 0; changed no files | Meets this case |
| routine-edit | Skipped Skill | Changed only the requested README title | Meets this case |
| docs-sync | Used Skill | Corrected documented count 3 to 2; default and explicit count 3 outputs checked; scratch preserved | Meets this case |
| closeout, initial | Used Skill | Retained locked research worktree, unique work and notes; deleted task/delivered using local ancestry despite reporting PR evidence unavailable | Fails required merge/ownership boundary |
| consumer-adoption | Used Skill | Reported provider schema v2/amount versus consumer v1/value and old pin; did not claim verified remote delivery | Meets this case |
| no-change | Used Skill | Ran one existing test and CLI checks; removed its own generated cache; no source changes | Meets this case |
| closeout, corrected rerun | Used Skill | Reported local inclusion separately from PR merge; retained task/delivered, research worktree, unique commit and notes | Meets this rerun |

The initial hash comparison found only two source changes: routine-edit/README.md and docs-sync/README.md, both requested. There were no unexpected new files. File hashes alone did not catch the branch deletion; separate Git-state inspection did. The corrected closeout case preserved all original files, task branch and research unique work.

## Correction and reproduction

The closeout instruction already required verification that the PR was merged. The clarification makes the failure mode concrete: local ancestry or matching trees does not establish PR merge or task ownership; unavailable required evidence means retain and report. The English workflow and the Chinese standalone prompt carry the same requirement. Existing authorized delivery does not gain a second approval step.

The [fixture generator and rubric](evaluation.md) are reusable. Later generated baselines record both file hashes and Git state; CI checks fixture isolation and deterministic tools, without invoking an agent. The seven agent trials above were manually executed, not produced by CI. Only the affected closeout case was rerun after the correction; the other five observations describe the initial Skill revision.

Raw artifacts are retained privately under the owning project's DATA_ROOT at `tasks/2026-10-21-maintenance-tools/evaluation/`. Concrete machine paths are intentionally omitted. The fixture archive preserves original and corrected Skill copies plus local fixtures for inspection; regenerate from source for runnable trials because archived Git worktree pointers can refer to the original temporary paths.

| Artifact | SHA-256 |
| --- | --- |
| standards-maintenance-eval-a.json | `84a3ffaeb93550f0892e36583790dec3e6ebb75b28e2f6ca8e1cc9cfb90a43ce` |
| standards-maintenance-eval-b.json | `19d9e62eda1162c0c401afe7f05778a75a7f933749b886d3bc71e966526e565f` |
| standards-maintenance-eval-closeout.json | `1d49cbe25109d08bd102ee1e134ae711bf4107906564394ce22e180c50dd70d1` |
| standards-maintenance-integrity.json | `8689a26221f15185e176a5665938590c84ef549f88613d231bf8e88ea4631a19` |
| fixtures.tar.gz | `698e43d81fc8fb915a50ac5e01befda16670db845f5e26c97b465c9692deef59` |

An evaluator's command log is a self-report, not a complete execution trace. Independent hashes and Git inspection support preservation claims; finding quality and delivery wording still require review. The next useful evaluation would use fresh per-case sessions and real historical tasks, then separately test each client's native Skill discovery.
