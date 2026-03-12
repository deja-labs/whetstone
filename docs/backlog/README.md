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

1. **Capture** — Add ideas to `IDEAS.md` as checkbox items (`- [ ]`). Quick and low-friction.
2. **Graduate** — When an idea is worth pursuing, create a story file in `stories/` using the template below. Check the box (`- [x]`) and move the idea to the **Done** section at the bottom of `IDEAS.md`.
3. **Implement** — Work the story. Update status as you go.
4. **Complete** — Change story status to `done` and add a completion date.

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

- Story IDs use the format `WHET-NNNN` starting at `WHET-0001`
- File names: `WHET-{NNNN}-{kebab-case-title}.md`
- Status flow: `draft` -> `ready` -> `in-progress` -> `done`
- Stories can be `dropped` if they're no longer relevant
- Keep IDEAS.md loose — no formatting requirements beyond bullet points
