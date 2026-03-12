# Backlog Agent Instructions

Instructions for AI agents working with the Whetstone backlog system.

## Adding an Idea

1. Open `IDEAS.md` and find the appropriate section (Branding, Dashboard, Pattern Detection, MCP Tools, Infrastructure). Create a new section if none fits.
2. Add a checkbox item: `- [ ] Brief description of the idea`
3. If the idea is ready to work on, graduate it to a story immediately (see below).

## Graduating an Idea to a Story

1. Determine the next available `WHET-NNNN` ID by scanning `IDEAS.md` for the highest existing number.
2. Create a story file in `stories/` named `WHET-{NNNN}-{kebab-case-title}.md` using the template in `README.md`.
3. Update the idea line in `IDEAS.md` to include the code: `` - [ ] `WHET-NNNN` Description ``
4. Ideas with story codes sort to the top of their section.
5. Stories that don't originate from IDEAS.md must still be added to the relevant section.

## Starting Work on a Story

1. Create a feature branch using git flow: `git flow feature start WHET-NNNN-kebab-case-title`
2. Update the story file status from `draft` or `ready` to `in-progress`.
3. Use the `[WHET-NNNN]` prefix in all related commit messages per the project's Conventional Commits format.

## Completing an Idea

All three of these steps must happen together:

1. **Update the story file**: set `status: done` and add `completed: YYYY-MM-DD` to the frontmatter.
2. **Move the story file**: from `stories/` to `stories/implemented/`.
3. **Update IDEAS.md**: check the box (`- [x]`) and move the line to the **Done** section at the bottom using the format: `` - [x] `WHET-NNNN` (YYYY-MM-DD) Description ``

Never skip any of these steps. They must all happen in the same commit.

## Dropping a Story

1. Set the story file status to `dropped`.
2. Move it to `stories/implemented/` (the directory holds all finished stories, not just successful ones).
3. In `IDEAS.md`, check the box and move to Done with a note: `` - [x] `WHET-NNNN` (YYYY-MM-DD) Description (dropped) ``

## Conventions

- Story IDs are sequential: `WHET-0001`, `WHET-0002`, etc. Always use the next available number.
- Story filenames use kebab-case: `WHET-0013-favicon-and-logo.md`
- Feature branches follow git flow: `feature/WHET-NNNN-kebab-case-title`
- Commit messages use Conventional Commits with the story prefix: `[WHET-NNNN] type: description`
- The Done section in IDEAS.md is a flat list with no category grouping.
- Keep IDEAS.md entries brief — a sentence or two. Detail belongs in the story file.
