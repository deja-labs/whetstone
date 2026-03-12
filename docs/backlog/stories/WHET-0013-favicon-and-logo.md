---
id: WHET-0013
title: Create favicon and logo
status: draft
priority: low
created: 2026-03-12
---

# WHET-0013: Create favicon and logo

## Problem

Whetstone has no visual identity. The dashboard shows a plain text title with no icon, browser tabs show a generic favicon, and the GitHub repo has no recognizable mark.

## Solution

Design a simple, recognizable mark for Whetstone using a sharpening stone or blade motif. Produce all required assets and integrate them into the dashboard.

## Tasks

- [ ] Design logo concept (sharpening stone / blade motif, works at small sizes)
- [ ] Produce SVG logo for dashboard header
- [ ] Generate favicon.ico (16×16, 32×32, 48×48 multi-size)
- [ ] Generate apple-touch-icon (180×180 PNG)
- [ ] Generate social/repo image (1280×640)
- [ ] Serve favicon from dashboard HTTP server (`/favicon.ico` route)
- [ ] Add logo to dashboard header next to "Whetstone" title
- [ ] Add `<link rel="icon">` and `<link rel="apple-touch-icon">` to dashboard HTML

## Notes

- Logo should be monochrome or use the existing dashboard accent colour so it works in both light and dark contexts.
- Keep the mark simple enough to be legible at 16×16.
- SVG source should be committed so future edits are easy.
