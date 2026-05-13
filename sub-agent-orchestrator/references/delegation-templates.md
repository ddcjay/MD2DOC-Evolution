# Delegation Templates

Use these templates when preparing actual sub-agent prompts. Keep prompts specific and bounded.

## Read-only Explorer

Use for independent codebase questions.

```text
You are an explorer for a larger Codex task. Answer this specific question:

Question:
<question>

Scope:
<directories, files, modules, or search terms>

Do not edit files. Do not solve adjacent problems. Return:
- Direct answer
- Supporting file paths and line references
- Any uncertainty or follow-up checks needed
```

## Worker With Disjoint Ownership

Use for implementation when the write set can be separated from other work.

```text
You are a worker in a shared codebase. You are not alone: other agents may be editing other areas. Do not revert or overwrite changes you did not make.

Goal:
<specific implementation goal>

You own:
<files, directories, or modules this worker may edit>

Do not touch:
<explicit non-goals and files owned by others>

Validation:
<tests, build commands, or manual checks to attempt>

When finished, report:
- Files changed
- Behavior changed
- Validation run and result
- Any risks or assumptions
```

## Parallel Review

Use when an independent pass can run while implementation continues.

```text
Review the current work for bugs, regressions, and missing tests.

Focus:
<feature, module, or risk area>

Scope:
<files or directories to inspect>

Do not edit files unless explicitly asked. Return findings first, ordered by severity, with file paths and line references. Include only actionable issues.
```

## Integration Checklist

Before final response:
- Confirm every spawned agent has either finished or is intentionally no longer needed.
- Inspect changed files from workers.
- Resolve ownership overlaps before running final verification.
- Run the highest-signal available test or explain why it was not run.
- Summarize what came from sub-agents versus what was integrated locally.
