import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { readCandidates } from "../../scripts/pipeline/lib";

const temporaryDirectories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "oppscout-seeding-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("seeding pipeline input", () => {
  it("combines top-level JSON arrays and candidates objects in filename order", () => {
    const inbox = temporaryDirectory();
    writeFileSync(join(inbox, "b.json"), JSON.stringify({ candidates: [{ title: "second" }] }));
    writeFileSync(join(inbox, "a.json"), JSON.stringify([{ title: "first" }]));
    writeFileSync(join(inbox, "notes.txt"), "not a candidate file");

    expect(readCandidates(inbox)).toEqual([{ title: "first" }, { title: "second" }]);
  });

  it("fails loudly when an inbox contains no JSON files", () => {
    const inbox = temporaryDirectory();
    mkdirSync(join(inbox, "nested"));

    expect(() => readCandidates(inbox)).toThrow(`No JSON candidate files found in ${inbox}.`);
  });
});
