import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["src", "prisma", "infra"];
const violations = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if ([".ts", ".tsx", ".prisma", ".md"].includes(extname(path))) {
      const text = await readFile(path, "utf8");
      if (/\b(TODO|FIXME)\b/.test(text)) violations.push(path);
    }
  }
}

for (const root of roots) await walk(root);
if (violations.length) {
  console.error(`Implementation contains unfinished markers:\n${violations.join("\n")}`);
  process.exit(1);
}
console.log("All-phase stub-marker check passed.");
