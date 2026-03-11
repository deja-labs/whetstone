import { createRequire } from "module";

const require = createRequire(import.meta.url);

// dist/lib/version.js → ../../package.json
export const VERSION: string = require("../../package.json").version;
