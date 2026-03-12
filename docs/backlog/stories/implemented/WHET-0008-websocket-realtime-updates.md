---
id: WHET-0008
title: WebSocket support for real-time dashboard updates
status: done
priority: medium
created: 2026-03-12
---

# WHET-0008: WebSocket support for real-time dashboard updates

## Problem

The dashboard polls every 10 seconds via `setInterval`, re-fetching all data regardless of whether anything changed. This is wasteful and sluggish — edits from MCP tools or the dashboard don't appear until the next poll cycle.

## Solution

Add a WebSocket server alongside the HTTP server. Watch the SQLite WAL file for changes to detect mutations from any source (dashboard, MCP server, CLI). Broadcast a "refresh" event to connected clients on change. Client connects via native WebSocket API and falls back to polling if disconnected.

## Tasks

- [x] Add `ws` dependency
- [x] Add WebSocketServer with WAL file watcher to dashboard server
- [x] Replace polling with WebSocket client in app component
- [x] Add polling fallback when WebSocket disconnects
- [x] Verify end-to-end real-time updates

## Notes

Uses a signal file (`.whetstone/.signal`) touched on every database write, watched by the dashboard via `fs.watch`. The dashboard closes its cached SQLite connection on signal so the next API request gets a fresh WAL snapshot. Falls back to 10s polling when WebSocket disconnects.
