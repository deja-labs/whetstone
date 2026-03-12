---
id: WHET-0008
title: WebSocket support for real-time dashboard updates
status: draft
priority: low
created: 2026-03-12
---

# WHET-0008: WebSocket support for real-time dashboard updates

## Problem

The dashboard uses a 10-second polling interval for auto-refresh. This means changes from MCP tool calls (new rejections, constraint updates) take up to 10 seconds to appear. Polling also generates unnecessary network traffic when nothing has changed.

## Solution

Add a WebSocket server alongside the existing HTTP server in `src/cli/dashboard.ts`. When the MCP server writes to the database, broadcast a lightweight notification over WebSocket. Dashboard components listen for these messages and re-fetch only the affected data.

## Tasks

- [ ] Add WebSocket server (use `ws` package) to `src/cli/dashboard.ts`
- [ ] Define message types: `rejection-added`, `constraint-updated`, `constraint-created`, `rejection-linked`
- [ ] Update dashboard client JS to open a WebSocket connection on load
- [ ] On WebSocket message, trigger the appropriate component refresh
- [ ] Fall back to polling if WebSocket connection fails
- [ ] Remove or lengthen the polling interval when WebSocket is connected
- [ ] Consider: how does the MCP server (separate process) notify the dashboard server of changes?

## Notes

The main challenge is cross-process notification. The MCP server and dashboard are separate processes sharing a SQLite database. Options:
- **File watcher** on the WAL file — simple but coarse
- **SQLite update hook** — only works within the same process
- **IPC / Unix socket** between MCP server and dashboard
- **Poll the DB for changes** server-side at a short interval, only push to clients when data actually changed

The simplest first step may be server-side polling with WebSocket push — still eliminates per-client polling and enables instant UI updates when changes are detected.
