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
