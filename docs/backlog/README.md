# Backlog

Lightweight idea and story tracking for Whetstone development.

## Structure

```
backlog/
  README.md          # this file
  IDEAS.md           # raw idea captures — unrefined, unsorted
  stories/           # one file per graduated story
    WHET-0001-*.md
    WHET-0002-*.md
    ...
```

## Workflow

### 1. Capture

Add ideas to `IDEAS.md` as checkbox items (`- [ ]`). Keep it low-friction — a sentence or two is fine. Group under the appropriate section heading (Dashboard, Pattern Detection, MCP Tools, Infrastructure).

### 2. Graduate to Story

When an idea is worth pursuing:

1. Create a story file in `stories/` using the template below with the next available `WHET-NNNN` ID
2. Add the `WHET-NNNN` code to the idea in `IDEAS.md` (e.g. `- [ ] \`WHET-0007\` My idea description`)
3. Ideas with story codes stay in the main list — they move to Done only when the story is complete or dropped

Stories that don't originate from IDEAS.md should still be added to the relevant section in IDEAS.md with their code, at the top of that section.

### 3. Implement

Work the story. Update the story file's status as you go: `draft` → `ready` → `in-progress` → `done`. Check off tasks in the story's task list as they're completed.

### 4. Complete

When a story is done:

1. Set its status to `done` and add a `completed` date in the frontmatter
2. In `IDEAS.md`, check the box (`- [x]`) and move the line to the **Done** section at the bottom using the format: `` - [x] `WHET-NNNN` (YYYY-MM-DD) Description ``

## Story File Template

```markdown
---
id: WHET-NNNN
title: Short descriptive title
status: draft | ready | in-progress | done | dropped
priority: high | medium | low
created: YYYY-MM-DD
completed: YYYY-MM-DD
---

# WHET-NNNN: Short descriptive title

## Problem

What's wrong or missing today.

## Solution

What we'll build or change.

## Tasks

- [ ] Task 1
- [ ] Task 2

## Notes

Any additional context, references, or decisions.
```

## Conventions

- Story IDs use the format `WHET-NNNN`, sequential starting at `WHET-0001`
- File names: `WHET-{NNNN}-{kebab-case-title}.md`
- Status flow: `draft` → `ready` → `in-progress` → `done`
- Stories can be `dropped` if they're no longer relevant
- Keep IDEAS.md loose — a sentence or two per idea, no formatting requirements beyond checkboxes
- Ideas with story codes are sorted to the top of their section in IDEAS.md
- The Done section in IDEAS.md is a flat list — no category grouping needed
- Done items use the format: `` `WHET-NNNN` (YYYY-MM-DD) Description `` — the date is the completion date from the story frontmatter
