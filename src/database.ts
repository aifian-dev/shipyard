import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

// Callers own the schema and must close the connection when finished.
export function openDatabase(path = process.env.DATABASE_PATH ?? ".data/app.sqlite") {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  return new DatabaseSync(path, { enableForeignKeyConstraints: true });
}
