import {
  formatRejectionResult,
  formatConstraintCreated,
  formatConstraintsList,
  formatSearchResults,
  formatAppliedResult,
  formatLinkResult,
  formatUpdateResult,
  formatPatternsResult,
  formatStatsResult,
} from "./format.js";

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

function required(flags: Map<string, string>, key: string, command: string): string {
  const value = flags.get(key);
  if (!value) {
    console.error(`Error: --${key} is required for '${command}'`);
    process.exit(1);
  }
  return value;
}

function csvToArray(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function runTool(command: string, args: string[]): Promise<void> {
  const flags = parseArgs(args);

  // Handle --db override
  const dbPath = flags.get("db");
  if (dbPath) {
    process.env.WHETSTONE_DB = dbPath;
  }

  try {
    switch (command) {
      case "reject": {
        const { reject } = await import("../tools/reject.js");
        const result = reject({
          domain: required(flags, "domain", command),
          description: required(flags, "desc", command),
          reasoning: flags.get("reasoning"),
          raw_output: flags.get("raw-output"),
        });
        console.log(formatRejectionResult(result));
        break;
      }

      case "constrain": {
        const { constrain } = await import("../tools/constrain.js");
        const result = constrain({
          domain: required(flags, "domain", command),
          category: required(flags, "category", command) as import("../lib/types.js").ConstraintCategory,
          title: required(flags, "title", command),
          rule: required(flags, "rule", command),
          reasoning: flags.get("reasoning"),
          rejected_example: flags.get("rejected-example"),
          accepted_example: flags.get("accepted-example"),
          tags: csvToArray(flags.get("tags")),
          severity: flags.get("severity") as import("../lib/types.js").Severity | undefined,
          source: flags.get("source"),
          rejection_ids: csvToArray(flags.get("rejection-ids")),
        });
        console.log(formatConstraintCreated(result));
        break;
      }

      case "get-constraints": {
        const { getConstraints } = await import("../tools/get-constraints.js");
        const result = getConstraints({
          domain: flags.get("domain"),
          severity: flags.get("severity"),
        });
        console.log(formatConstraintsList(result));
        break;
      }

      case "search": {
        const { search } = await import("../tools/search.js");
        const query = required(flags, "query", command);
        const result = search({
          query,
          type: flags.get("type") as "constraints" | "rejections" | "all" | undefined,
        });
        console.log(formatSearchResults(result, query));
        break;
      }

      case "applied": {
        const { applied } = await import("../tools/applied.js");
        const result = applied({
          constraint_id: required(flags, "id", command),
        });
        console.log(formatAppliedResult(result));
        break;
      }

      case "link": {
        const { link } = await import("../tools/link.js");
        const rejectionIds = csvToArray(required(flags, "rejection-ids", command));
        const result = link({
          constraint_id: required(flags, "id", command),
          rejection_ids: rejectionIds!,
        });
        console.log(formatLinkResult(result));
        break;
      }

      case "update-constraint": {
        const { updateConstraint } = await import("../tools/update-constraint.js");
        const result = updateConstraint({
          id: required(flags, "id", command),
          title: flags.get("title"),
          rule: flags.get("rule"),
          reasoning: flags.get("reasoning"),
          rejected_example: flags.get("rejected-example"),
          accepted_example: flags.get("accepted-example"),
          tags: csvToArray(flags.get("tags")),
          severity: flags.get("severity") as import("../lib/types.js").Severity | undefined,
          status: flags.get("status") as import("../lib/types.js").ConstraintStatus | undefined,
        });
        console.log(formatUpdateResult(result));
        break;
      }

      case "patterns": {
        const { patterns } = await import("../tools/patterns.js");
        const result = patterns({
          domain: flags.get("domain"),
          since: flags.get("since"),
        });
        console.log(formatPatternsResult(result));
        break;
      }

      case "stats": {
        const { stats } = await import("../tools/stats.js");
        const result = stats();
        console.log(formatStatsResult(result));
        break;
      }

      default:
        console.error(`Unknown tool command: ${command}`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}
