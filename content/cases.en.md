# Four incidents, four checks worth keeping

The speaker's draft supplies the operational experiences. Repository history was inspected on October 12, 2026. All five linked PR repositories were confirmed public. The source notes below state what the records support and which details remain recollection. A deleted-line count is not a duplicate-code count.

## A holiday exceeded a seven-day freshness window

A weekly report was blocked after a long holiday. The repair validates freshness against the prior open trading session and checks calendar evidence rather than relying only on elapsed calendar days.

Engineering lesson: define the time domain explicitly, and test long closures at the producer/consumer boundary.

<details><summary>Evidence and limits</summary>

[Platform PR #216](https://github.com/runchengxie/quant-intel-platform/pull/216), merge `4131c7e`, implementation `21f457b`: reporting performance validation, regression tests and a freshness contract document. The PR confirms eight calendar days against a seven-day rule. Provider evidence is optional: artifacts without it retain the seven-calendar-day fallback. Malformed or inconsistent evidence fails closed.

</details>

## A send can succeed while its acknowledgment is lost

A notification pipeline needed protection from repeated sends. PR #220 preserves unknown outcomes, blocks fallback on uncertain sends, binds delivery identity to content and verifies recovery. Treating uncertainty as failure can cause a retry to duplicate a message.

Engineering lesson: represent unknown outcomes, define retry boundaries and validate recovery at the business level.

<details><summary>Evidence and limits</summary>

[Platform PR #220](https://github.com/runchengxie/quant-intel-platform/pull/220), commit `0aa2bdf`, includes delivery state, intents, senders and regression checks. The 09:00 → 07:00 scheduling change and roughly two-week stabilization period are the speaker's recollection, not measurements established by this PR alone. The design does not establish exactly-once delivery for every transport failure.

</details>

## Two repositories retained overlapping frontend responsibilities

The platform retired its report frontend; the Pages repository delegated freshness monitoring to Deploy. Clarifying who generates, presents, deploys and monitors reports makes later changes easier to locate and verify.

Engineering lesson: give each capability an owner and test its published boundary.

<details><summary>Evidence and counting scope</summary>

[Platform PR #211](https://github.com/runchengxie/quant-intel-platform/pull/211), merge `4859b20`, implementation `f253443`: 201 changed files, 234 added lines and 36,342 deleted lines. This is a retirement diff containing source, tests, configuration and generated artifacts. It is not a measured count of duplicate source code. [Pages PR #98](https://github.com/runchengxie/quant-intel-pages/pull/98), commit `10a536c`, delegates report freshness monitoring to Deploy. The report-version symptom and AI placing work in the wrong repository come from the speaker's account; the records do not prove a model's intent.

</details>

## A checker must also verify what it checks

The quality scanner has a regression test for nested Git scopes and directory boundaries. A green result is useful only when the intended files were included.

Engineering lesson: verify discovery coverage separately from violation counts.

<details><summary>Evidence and sample scope</summary>

[Quality PR #10](https://github.com/runchengxie/quant-code-quality/pull/10) is the speaker's reference. The current local `tests/test_scanner.py` covers nested Git scopes. The PR records a read-only audit of quant-research: the old scanner found 674 files and 12 long functions, while the corrected scanner found 1,656 files and 94 long functions in that configured scope. These are discovery/maintainability audit counts, not test-coverage percentages. A narrower scan does not prove that AI deliberately concealed errors.

</details>
