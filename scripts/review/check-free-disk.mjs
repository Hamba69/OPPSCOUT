import { existsSync, statSync, statfsSync } from "node:fs";
import { dirname, join, parse, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const warningThresholdBytes = 3 * 1024 ** 3;
const worktreeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const paths = [
  { label: "worktree and .next output", path: worktreeRoot },
  { label: "temporary files", path: tmpdir() },
];
const worktreeList = spawnSync("git", ["worktree", "list", "--porcelain"], {
  cwd: worktreeRoot,
  encoding: "utf8",
});
if (worktreeList.error || worktreeList.status !== 0) {
  throw new Error("Could not identify registered Git worktrees for the free-disk check.");
}
for (const line of worktreeList.stdout.split(/\r?\n/)) {
  if (!line.startsWith("worktree ")) continue;
  const path = line.slice("worktree ".length);
  paths.push({ label: "registered worktree and .next output", path });
}

if (process.env.LOCALAPPDATA) {
  paths.push({
    label: "Docker data",
    path: process.env.DOCKER_DATA_DIR ?? join(process.env.LOCALAPPDATA, "Docker", "wsl"),
  });
}

function existingPath(path) {
  let candidate = resolve(path);
  while (!existsSync(candidate)) {
    const parent = dirname(candidate);
    if (parent === candidate) throw new Error(`Could not resolve a disk path for ${path}.`);
    candidate = parent;
  }
  return candidate;
}

const disks = new Map();
for (const entry of paths) {
  const existing = existingPath(entry.path);
  const filesystem = statfsSync(existing);
  const device = statSync(existing).dev;
  const key = process.platform === "win32" ? parse(existing).root.toLowerCase() : String(device);
  const disk = disks.get(key) ?? {
    label: parse(existing).root || existing,
    freeBytes: filesystem.bavail * filesystem.bsize,
    uses: [],
  };
  disk.uses.push(entry.label);
  disks.set(key, disk);
}

for (const disk of disks.values()) {
  const freeGiB = disk.freeBytes / 1024 ** 3;
  const usage = [...new Set(disk.uses)].join(", ");
  if (disk.freeBytes < warningThresholdBytes) {
    console.warn(`WARNING: only ${freeGiB.toFixed(2)} GB is free on ${disk.label} (${usage}); less than 3 GB.`);
  } else {
    console.log(`Free disk space on ${disk.label}: ${freeGiB.toFixed(2)} GB (${usage}).`);
  }
}
