// Extract text content from an MCP JSON-RPC response on stdin.
// Replaces `python3 -m json.tool` in Makefile tool targets.

let data = "";
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => {
  try {
    const response = JSON.parse(data);
    const text = response.result?.content?.[0]?.text;
    if (text) {
      console.log(text);
    } else if (response.error) {
      console.error(`Error: ${response.error.message}`);
      process.exit(1);
    } else {
      console.log(JSON.stringify(response, null, 2));
    }
  } catch {
    process.stdout.write(data);
  }
});
