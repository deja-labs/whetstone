#!/usr/bin/env node

import { VERSION } from "./lib/version.js";

// CLI dispatch: handle subcommands before loading MCP server
const cliCommand = process.argv[2];

const TOOL_COMMANDS = new Set([
  "reject", "constrain", "get-constraints", "search",
  "applied", "link", "update-constraint", "patterns", "stats",
]);

if (cliCommand === "init") {
  const { runInit } = await import("./cli/init.js");
  await runInit();
} else if (cliCommand === "export") {
  const { runExport } = await import("./cli/export.js");
  runExport(process.argv.slice(3));
} else if (cliCommand === "hook") {
  const { runHook } = await import("./cli/hook.js");
  await runHook();
} else if (cliCommand === "-v" || cliCommand === "--version") {
  console.log(VERSION);
} else if (cliCommand === "-h" || cliCommand === "--help" || cliCommand === "help") {
  const { runHelp } = await import("./cli/help.js");
  await runHelp();
} else if (cliCommand && TOOL_COMMANDS.has(cliCommand)) {
  const { runTool } = await import("./cli/tool.js");
  await runTool(cliCommand, process.argv.slice(3));
} else {
  await startServer();
}

async function startServer(): Promise<void> {
  const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const { z } = await import("zod");
  const { reject } = await import("./tools/reject.js");
  const { constrain } = await import("./tools/constrain.js");
  const { getConstraints } = await import("./tools/get-constraints.js");
  const { search } = await import("./tools/search.js");
  const { applied } = await import("./tools/applied.js");
  const { link } = await import("./tools/link.js");
  const { updateConstraint } = await import("./tools/update-constraint.js");
  const { exportConstraints } = await import("./tools/export.js");
  const { closeDb } = await import("./db/connection.js");
  const fmt = await import("./cli/format.js");

  const server = new McpServer({
    name: "whetstone",
    version: VERSION,
  });

  server.tool(
    "reject",
    "Log a rejection of AI output. Capture what was wrong and why — the raw material for building durable constraints.",
    {
      domain: z.string().describe('The domain this rejection belongs to, e.g. "frontend", "backend", "api-design", "ux"'),
      description: z.string().describe("What was rejected — describe the problem"),
      reasoning: z.string().optional().describe("Why it was wrong — the judgment behind the rejection"),
      raw_output: z.string().optional().describe("The offending AI output, if worth preserving"),
    },
    async (input) => {
      const rejection = reject(input);
      return { content: [{ type: "text", text: fmt.formatRejectionResult(rejection) }] };
    },
  );

  server.tool(
    "constrain",
    "Create a durable constraint — an encoded rule distilled from rejections. Constraints are applied proactively by agents before generating output.",
    {
      domain: z.string().describe('The domain, e.g. "frontend", "backend", "api-design", "ux"'),
      category: z.enum(["code-quality", "pattern", "business-logic", "framing", "reasoning", "editorial"]).describe("The type of constraint"),
      title: z.string().describe("Short, scannable summary of the constraint"),
      rule: z.string().describe("The constraint itself, in imperative voice"),
      reasoning: z.string().optional().describe("Why this constraint matters"),
      rejected_example: z.string().optional().describe("What bad looks like"),
      accepted_example: z.string().optional().describe("What good looks like"),
      tags: z.array(z.string()).optional().describe("Tags for flexible filtering"),
      severity: z.enum(["critical", "important", "preference"]).optional().describe("How important this constraint is (default: important)"),
      source: z.enum(["conversation", "pr-review", "retrospective"]).optional().describe("Where this constraint originated"),
      rejection_ids: z.array(z.string()).optional().describe("Rejection IDs to link to this constraint — marks them as encoded"),
    },
    async (input) => {
      const constraint = constrain(input);
      return { content: [{ type: "text", text: fmt.formatConstraintCreated(constraint) }] };
    },
  );

  server.tool(
    "get_constraints",
    "Get active constraints for proactive application. Call this before generating output to pre-apply taste. Returns constraints filtered by domain and/or severity.",
    {
      domain: z.string().optional().describe('Filter by domain, e.g. "frontend", "backend". Omit to get all domains.'),
      severity: z.enum(["critical", "important", "preference"]).optional().describe("Minimum severity to include (default: all)"),
    },
    async (input) => {
      const constraints = getConstraints(input);
      return { content: [{ type: "text", text: fmt.formatConstraintsList(constraints) }] };
    },
  );

  server.tool(
    "search",
    "Free-text search across constraints and rejections. Find existing taste by keyword.",
    {
      query: z.string().describe("Search text to match against titles, rules, descriptions, reasoning, and tags"),
      type: z.enum(["constraints", "rejections", "all"]).optional().describe("What to search (default: all)"),
    },
    async (input) => {
      const results = search(input);
      return { content: [{ type: "text", text: fmt.formatSearchResults(results, input.query) }] };
    },
  );

  server.tool(
    "applied",
    "Mark a constraint as applied. Call this after using a constraint during generation to track what's actually valuable.",
    {
      constraint_id: z.string().describe("The ID of the constraint that was applied"),
    },
    async (input) => {
      const result = applied(input);
      return { content: [{ type: "text", text: fmt.formatAppliedResult(result) }] };
    },
  );

  server.tool(
    "link",
    "Link rejections to a constraint. Use this to mark rejections as encoded after creating a constraint from them. Closes the rejection-to-constraint flywheel.",
    {
      constraint_id: z.string().describe("The constraint that encodes these rejections"),
      rejection_ids: z.array(z.string()).describe("Rejection IDs to link to the constraint"),
    },
    async (input) => {
      const result = link(input);
      return { content: [{ type: "text", text: fmt.formatLinkResult(result) }] };
    },
  );

  server.tool(
    "update_constraint",
    "Refine, supersede, or deprecate a constraint. Use this to evolve constraints as your taste sharpens.",
    {
      id: z.string().describe("The ID of the constraint to update"),
      title: z.string().optional().describe("Updated title"),
      rule: z.string().optional().describe("Updated rule"),
      reasoning: z.string().optional().describe("Updated reasoning"),
      rejected_example: z.string().optional().describe("Updated bad example"),
      accepted_example: z.string().optional().describe("Updated good example"),
      tags: z.array(z.string()).optional().describe("Updated tags"),
      severity: z.enum(["critical", "important", "preference"]).optional().describe("Updated severity"),
      status: z.enum(["active", "superseded", "deprecated"]).optional().describe("Updated status"),
    },
    async (input) => {
      const constraint = updateConstraint(input);
      return { content: [{ type: "text", text: fmt.formatUpdateResult(constraint) }] };
    },
  );

  server.tool(
    "export",
    "Export constraints as markdown or JSON. Use for graduating constraints into project docs (CLAUDE.md, steering files, Codex instructions). Also used by the pre-push git hook.",
    {
      domain: z.string().optional().describe("Filter by domain, or export all"),
      format: z.enum(["markdown", "json"]).optional().describe("Output format (default: markdown)"),
    },
    async (input) => {
      const output = exportConstraints(input);
      return { content: [{ type: "text", text: output }] };
    },
  );

  server.tool(
    "patterns",
    "Surface clusters of similar rejections that haven't been encoded as constraints yet. Groups rejections by textual similarity within each domain — the 'you keep saying the same no' detector.",
    {
      domain: z.string().optional().describe("Filter by domain"),
      since: z.string().optional().describe("ISO date — only look at rejections since this date (default: last 30 days)"),
    },
    async (input) => {
      const { patterns } = await import("./tools/patterns.js");
      const results = patterns(input);
      return { content: [{ type: "text", text: fmt.formatPatternsResult(results) }] };
    },
  );

  server.tool(
    "stats",
    "Get rejection and constraint statistics — total counts, rejections by domain, most-applied constraints, and coverage gaps.",
    {},
    async () => {
      const { stats } = await import("./tools/stats.js");
      const s = stats();
      return { content: [{ type: "text", text: fmt.formatStatsResult(s) }] };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on("SIGINT", () => {
    closeDb();
    process.exit(0);
  });
}
