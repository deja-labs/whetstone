---
id: WHET-0013
title: Create favicon and logo
status: done
priority: low
created: 2026-03-12
---

# WHET-0013: Create favicon and logo

## Problem

Whetstone has no visual identity. The dashboard shows a plain text title with no icon, browser tabs show a generic favicon, and the GitHub repo has no recognizable mark.

## Solution

Design a simple, recognizable mark for Whetstone using a sharpening stone or blade motif. Produce all required assets and integrate them into the dashboard.

## Tasks

- [x] Design logo concept (sharpening stone / blade motif, works at small sizes)
- [x] Produce SVG logo for dashboard header
- [x] Generate favicon.ico (16×16, 32×32, 48×48 multi-size)
- [x] Generate apple-touch-icon (180×180 PNG)
- [x] Generate social/repo image (1280×640)
- [x] Serve favicon from dashboard HTTP server (embedded as base64 data URI)
- [x] Add logo to dashboard header next to "Whetstone" title
- [x] Add `<link rel="icon">` and `<link rel="apple-touch-icon">` to dashboard HTML

## Notes

- Logo generated via Recraft V4 Vector API — 44 variants explored across 11 directions
- Selected design: `honing-circle-2.svg` — circular sharpening motif with diagonal blade stroke
- Amber-500 (#F59E0B) brand colour, works on dark backgrounds
- All 44 concept variants preserved in `assets/logo-concepts/recraft/`
- Favicon assets generated from SVG via sharp + png-to-ico
- Assets embedded as base64 data URIs in the HTML — no extra server routes needed
