---
name: sub-agent-orchestrator
description: Plan and supervise safe sub-agent delegation for Codex. Use when a coding, research, review, or verification task may benefit from multiple sub-agents working in parallel, especially when preventing duplicated effort, file ownership conflicts, inconsistent findings, or unintegrated worker output matters.
---

# Sub-agent Orchestrator

Use this skill to decide whether to spawn sub-agents, split work into bounded assignments, and integrate their results without creating coordination problems.

## Decision Gate

Spawn sub-agents only when at least one subtask can run in parallel while the main agent continues useful non-overlapping work.

Prefer local work when:
- The next step is blocked on the subtask result.
- The task is small enough that delegation overhead is larger than the work.
- The needed change touches the same files or tightly coupled logic.
- The user asked for a direct answer, not parallel execution.

Use sub-agents when:
- Independent codebase questions can be answered in parallel.
- Implementation can be split by disjoint file or module ownership.
- A review or verification pass can run while implementation continues.
- The task is large enough that separate reports will materially reduce uncertainty.

## Orchestration Workflow

1. Map the task into immediate blocking work and sidecar work.
2. Keep the immediate blocking work local.
3. Delegate only concrete sidecar tasks with clear boundaries.
4. Assign explicit ownership for any write task.
5. Tell every worker they are not alone in the codebase and must not revert others' edits.
6. Continue local non-overlapping work while sub-agents run.
7. Review returned changes or findings before integration.
8. Resolve conflicts explicitly and verify the final behavior.

## Assignment Contract

Every delegated task must include:
- Goal: the exact outcome needed.
- Scope: files, directories, modules, or read-only question boundaries.
- Non-goals: what the sub-agent must not touch.
- Output: expected final report or changed file list.
- Coordination note: mention concurrent work and no reverting others' changes.
- Validation: what test, command, or inspection should be attempted when practical.

For code edits, prefer one worker per disjoint write set. Do not ask two workers to edit the same file unless their work is intentionally sequential and reviewed between steps.

## Risk Controls

Avoid duplicated work:
- Before spawning, state what each agent owns.
- Do not ask multiple agents the same question unless intentionally seeking independent review.

Avoid file conflicts:
- Partition by module, route, package, or test file.
- If ownership cannot be separated, keep the work local.

Avoid inconsistent reports:
- Require concise evidence: file paths, line references, commands run, or observed behavior.
- Treat sub-agent output as input to review, not automatic truth.

Avoid unintegrated work:
- Track outstanding agents.
- Review changed files quickly after each worker finishes.
- Run final verification from the main context when feasible.

## Prompt Templates

For reusable delegation and review prompt patterns, read `references/delegation-templates.md` only when preparing actual sub-agent prompts or when the task has multiple parallel workstreams.
