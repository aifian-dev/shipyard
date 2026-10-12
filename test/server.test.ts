import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { createApp } from "../src/server.js";

test("health endpoint responds through a real local HTTP connection", async (t) => {
  const server = createApp();
  t.after(() => server.close());
  await server.listen({ port: 0, host: "127.0.0.1" });
  const { port } = server.server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/);
  assert.deepEqual(await response.json(), { status: "ok" });
});
