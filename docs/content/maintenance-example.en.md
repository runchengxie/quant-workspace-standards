## A maintenance request from inspection to handoff

This is a synthetic local exercise, not a production incident or a completed GitHub delivery. It reproduces the `docs-sync` fixture from the six-case evaluation.

**Request:** “Check and fix documentation that disagrees with the CLI defaults. Verify the examples and preserve other people's uncommitted changes.”

### Establish the baseline

Read the fixture's AGENTS.md, then inspect status, branch, remotes and worktrees. The fixture is on main with an existing untracked `scratch.txt`. It has no remote, and its instructions do not authorize commits or PRs. The request selects the documentation workflow; a broad architecture audit would add no value here.

### Find the mismatch

README says the default count is 3. The implementation sets `default=2`. Running `python3 -B app.py` prints two greetings; `python3 -B app.py --count 3` prints three. This is a documentation defect: the explicit argument works, and the implemented default is unambiguous.

### Make and verify the bounded correction

Change only the README default from 3 to 2. Compare its diff, run both commands again, and verify the scratch file's bytes match the baseline. The independent evaluator did this; subsequent hash comparison found only the intended README change. The application and user notes were preserved.

### Report delivery honestly

| State | Evidence in this exercise |
| --- | --- |
| Implemented | README now records default 2 |
| Locally verified | Default and explicit-count commands passed; diff check passed |
| Committed | No new commit |
| PR / merged | Not performed; no remote or authorization |
| Released / deployed / adopted | Not verified |

In a real repository, continue through its existing authorized branch and PR workflow. Run [the push preflight](https://github.com/runchengxie/quant-workspace-standards/blob/main/docs/maintenance/tools.en.md) before pushing, verify the actual current remote and required checks, and record the real PR and merge revision. This exercise does not invent those states merely to complete the story.

### Decide what can be cleaned

Preserve `scratch.txt`: it predates the task. In the companion closeout case, a task commit already appears in local main, but required PR merge evidence is unavailable. The corrected workflow retains that branch as well as the locked research worktree, its unique commit and its notes. Local ancestry alone is insufficient evidence for cleanup.

When implementation, documentation and checks already agree, the valid result is “no source change needed.” The `no-change` case ran its one existing test and CLI examples, removed only its own generated cache, and produced no source changes.

<details>
<summary>Reproduce and inspect the evidence</summary>

From the standards repository, prepare a new disposable directory outside source:

```sh
python3 -B scripts/prepare-maintenance-evals.py --output /tmp/maintenance-example-new
```

Run only the selected fixture's request, then compare its files and Git state to the saved baseline. The generator also prepares a locked worktree for the separate closeout case; these are disposable evaluation resources, not real services. Read [the evaluation procedure](https://github.com/runchengxie/quant-workspace-standards/blob/main/docs/maintenance/evaluation.md) before running an agent. See [the observed results](https://github.com/runchengxie/quant-workspace-standards/blob/main/docs/maintenance/evaluation-2026-10-21.md), including the first closeout failure and its rerun. This small controlled exercise does not estimate native Skill discovery or real-world failure rates.

</details>
