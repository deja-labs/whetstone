import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { exec } from "child_process";
import { platform } from "os";
import { getDashboardHtml } from "./dashboard-html.js";

const DEFAULT_PORT = 1337;

function parseArgs(args: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--") && i + 1 < args.length) {
      map.set(arg.slice(2), args[++i]);
    }
  }
  return map;
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data));
}

function sendHtml(res: ServerResponse, html: string): void {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function openBrowser(url: string): void {
  const cmd = platform() === "darwin" ? "open"
    : platform() === "win32" ? "start"
    : "xdg-open";
  exec(`${cmd} ${url}`);
}

export async function runDashboard(args: string[]): Promise<void> {
  const flags = parseArgs(args);
  const port = flags.has("port") ? parseInt(flags.get("port")!, 10) : DEFAULT_PORT;

  if (flags.has("db")) {
    process.env.WHETSTONE_DB = flags.get("db");
  }

  // Pre-load database and tool modules
  const { getDb, closeDb } = await import("../db/connection.js");
  getDb(); // fail fast if db can't initialize

  const { VERSION } = await import("../lib/version.js");
  const { stats } = await import("../tools/stats.js");
  const { list } = await import("../tools/list.js");
  const { getConstraints } = await import("../tools/get-constraints.js");
  const { search } = await import("../tools/search.js");
  const { patterns } = await import("../tools/patterns.js");

  const html = getDashboardHtml(VERSION);

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const path = url.pathname;
    const method = req.method ?? "GET";

    try {
      if (path === "/" || path === "") {
        sendHtml(res, html);
      } else if (path === "/api/stats") {
        sendJson(res, 200, stats());
      } else if (path === "/api/list") {
        sendJson(res, 200, list({
          domain: url.searchParams.get("domain") ?? undefined,
          status: (url.searchParams.get("status") as "encoded" | "unencoded" | "all") ?? undefined,
          limit: url.searchParams.has("limit")
            ? parseInt(url.searchParams.get("limit")!, 10)
            : undefined,
        }));
      } else if (path === "/api/constraints/all") {
        const db = getDb();
        const conditions: string[] = [];
        const params: string[] = [];
        const domain = url.searchParams.get("domain");
        const severity = url.searchParams.get("severity");
        const status = url.searchParams.get("status");
        const category = url.searchParams.get("category");
        const q = url.searchParams.get("q");
        if (domain) { conditions.push("c.domain = ?"); params.push(domain); }
        if (severity) { conditions.push("c.severity = ?"); params.push(severity); }
        if (status) { conditions.push("c.status = ?"); params.push(status); }
        if (category) { conditions.push("c.category = ?"); params.push(category); }
        if (q) { conditions.push("(c.title LIKE ? OR c.rule LIKE ? OR c.tags LIKE ?)"); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
        const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
        const sortParam = url.searchParams.get("sort") ?? "newest";
        const orderMap: Record<string, string> = {
          newest: "c.created_at DESC",
          applied: "c.times_applied DESC, c.created_at DESC",
          severity: "CASE c.severity WHEN 'critical' THEN 1 WHEN 'important' THEN 2 ELSE 3 END, c.created_at DESC",
          alpha: "c.title ASC",
        };
        const order = orderMap[sortParam] ?? orderMap.newest;
        const rows = db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM rejections WHERE constraint_id = c.id) as linked_rejection_count FROM constraints c ${where} ORDER BY ${order}`).all(...params);
        sendJson(res, 200, rows);
      } else if (path === "/api/constraints/summary") {
        const db = getDb();
        const byStatus = db.prepare("SELECT status, COUNT(*) as count FROM constraints GROUP BY status").all();
        const bySeverity = db.prepare("SELECT severity, COUNT(*) as count FROM constraints GROUP BY severity").all();
        const byDomain = db.prepare("SELECT domain, COUNT(*) as count FROM constraints GROUP BY domain ORDER BY count DESC").all();
        const byCategory = db.prepare("SELECT category, COUNT(*) as count FROM constraints GROUP BY category ORDER BY count DESC").all();
        const total = db.prepare("SELECT COUNT(*) as count FROM constraints").get() as { count: number };
        sendJson(res, 200, { total: total.count, by_status: byStatus, by_severity: bySeverity, by_domain: byDomain, by_category: byCategory });
      } else if (path === "/api/constraints") {
        sendJson(res, 200, getConstraints({
          domain: url.searchParams.get("domain") ?? undefined,
          severity: url.searchParams.get("severity") ?? undefined,
        }));
      } else if (path === "/api/search") {
        const q = url.searchParams.get("q");
        if (!q) {
          sendJson(res, 400, { error: "Missing required query parameter: q" });
          return;
        }
        sendJson(res, 200, search({
          query: q,
          type: (url.searchParams.get("type") as "constraints" | "rejections" | "all") ?? undefined,
        }));
      } else if (path === "/api/patterns") {
        sendJson(res, 200, patterns({
          domain: url.searchParams.get("domain") ?? undefined,
          since: url.searchParams.get("since") ?? undefined,
        }));
      } else if (path.startsWith("/api/rejection/")) {
        const parts = path.slice("/api/rejection/".length).split("/");
        const id = parts[0];
        if (!id) { sendJson(res, 400, { error: "Missing rejection ID" }); return; }
        const db = getDb();

        if (parts[1] === "unlink" && method === "POST") {
          const rejection = db.prepare("SELECT id, constraint_id FROM rejections WHERE id = ?").get(id) as { id: string; constraint_id: string | null } | undefined;
          if (!rejection) { sendJson(res, 404, { error: "Rejection not found" }); return; }
          if (!rejection.constraint_id) { sendJson(res, 400, { error: "Rejection is not linked to any constraint" }); return; }
          db.prepare("UPDATE rejections SET constraint_id = NULL WHERE id = ?").run(id);
          sendJson(res, 200, { success: true, rejection_id: id });
        } else {
          const rejection = db.prepare("SELECT * FROM rejections WHERE id = ?").get(id);
          if (!rejection) { sendJson(res, 404, { error: "Rejection not found" }); return; }
          sendJson(res, 200, rejection);
        }
      } else if (path.startsWith("/api/constraint/")) {
        const id = path.slice("/api/constraint/".length);
        if (!id) { sendJson(res, 400, { error: "Missing constraint ID" }); return; }
        const db = getDb();

        if (method === "DELETE") {
          const constraint = db.prepare("SELECT id FROM constraints WHERE id = ?").get(id);
          if (!constraint) { sendJson(res, 404, { error: "Constraint not found" }); return; }
          const linked = db.prepare("SELECT COUNT(*) as count FROM rejections WHERE constraint_id = ?").get(id) as { count: number };
          if (linked.count > 0) {
            sendJson(res, 400, { error: `Cannot delete constraint with ${linked.count} linked rejection(s). Unlink them first.` });
            return;
          }
          db.prepare("DELETE FROM constraints WHERE id = ?").run(id);
          sendJson(res, 200, { success: true, constraint_id: id });
        } else {
          const constraint = db.prepare("SELECT * FROM constraints WHERE id = ?").get(id);
          if (!constraint) { sendJson(res, 404, { error: "Constraint not found" }); return; }
          const linkedRejections = db.prepare("SELECT * FROM rejections WHERE constraint_id = ? ORDER BY created_at DESC").all(id);
          sendJson(res, 200, { ...constraint as Record<string, unknown>, linked_rejections: linkedRejections });
        }
      } else {
        sendJson(res, 404, { error: "Not found" });
      }
    } catch (err) {
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Error: port ${port} is already in use. Try: whetstone dashboard --port <number>`);
      process.exit(1);
    }
    throw err;
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.error(`\n  whetstone dashboard running at ${url}`);
    console.error("  Press Ctrl+C to stop.\n");
    openBrowser(url);
  });

  process.on("SIGINT", () => {
    console.error("\n  Shutting down...");
    server.close();
    closeDb();
    process.exit(0);
  });
}
