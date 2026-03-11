import { writeFileSync } from "fs";
import { exportConstraints } from "../tools/export.js";

export function runExport(args: string[]): void {
  let format: "markdown" | "json" = "markdown";
  let output: string | undefined;
  let dbPath: string | undefined;
  let domain: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--format":
        format = args[++i] as "markdown" | "json";
        break;
      case "--output":
        output = args[++i];
        break;
      case "--db":
        dbPath = args[++i];
        break;
      case "--domain":
        domain = args[++i];
        break;
    }
  }

  if (dbPath) {
    process.env.WHETSTONE_DB = dbPath;
  }

  const result = exportConstraints({ domain, format });

  if (output) {
    writeFileSync(output, result, "utf-8");
    console.log(`Exported to ${output}`);
  } else {
    console.log(result);
  }
}
