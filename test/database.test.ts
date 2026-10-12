import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { openDatabase } from "../src/database.js";

test("database helper creates its directory and persists data after reopening", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "backend-database-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "nested", "probe.sqlite");
  const initial = openDatabase(path);
  try {
    initial.exec("CREATE TABLE probe (value TEXT NOT NULL)");
    initial.prepare("INSERT INTO probe (value) VALUES (?)").run("saved");
  } finally {
    initial.close();
  }
  const reopened = openDatabase(path);
  try {
    assert.equal(reopened.prepare("SELECT value FROM probe").get()?.value, "saved");
    assert.equal(reopened.prepare("PRAGMA foreign_keys").get()?.foreign_keys, 1);
  } finally {
    reopened.close();
  }
});
