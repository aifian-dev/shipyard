import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareRequest } from "../ui/src/request.js";

test("console routes local paths and retains JSON headers/body", () => {
  const request = prepareRequest("POST", "/example?x=1", '{"X-Test":"value"}', '{"value":1}');
  assert.equal(request.url, "/api/example?x=1");
  assert.equal(request.init.headers.get("X-Test"), "value");
  assert.equal(request.init.headers.get("Content-Type"), "application/json");
  assert.equal(request.init.body, '{"value":1}');
  assert.equal(request.init.redirect, "error");
  assert.equal(request.init.credentials, "omit");
});

test("console rejects external targets and proxy escapes", () => {
  for (const path of ["https://example.com", "//example.com", "/\\example.com", "/../@fs/etc/passwd", "/%2e%2e/private", "/health#fragment", "/ health"]) {
    assert.throws(() => prepareRequest("GET", path, "{}", ""), Error, path);
  }
});

test("console rejects malformed headers/body and omits GET/HEAD bodies", () => {
  for (const headers of ["null", "[]", '{"X-Test":1}', "not json"]) {
    assert.throws(() => prepareRequest("POST", "/example", headers, ""));
  }
  assert.throws(() => prepareRequest("POST", "/example", "{}", "not json"));
  for (const method of ["GET", "HEAD"]) {
    assert.equal(prepareRequest(method, "/health", "", "not json").init.body, undefined);
  }
});

test("dev proxy sends JSON and headers to local API and does not follow redirects", async () => {
  const { createApp } = await import("../src/server.js");
  const { createServer } = await import("vite");
  const { default: config } = await import("../vite.config.js");
  const api = createApp();
  api.post("/echo", async request => ({ body: request.body, header: request.headers["x-test"] }));
  api.get("/redirect", async (_request, reply) => reply.redirect("http://127.0.0.1:1/never"));
  const apiAddress = await api.listen({ host: "127.0.0.1", port: 0 });
  const proxy = config.server!.proxy!["^/api(?:/|$|\\?)"];
  assert.equal(typeof proxy, "object");
  const ui = await createServer({
    ...config,
    configFile: false,
    server: { ...config.server, port: 0, proxy: { "^/api(?:/|$|\\?)": { ...(proxy as object), target: apiAddress } } },
  });
  try {
    await ui.listen();
    const address = ui.httpServer!.address();
    assert.ok(address && typeof address !== "string");
    const origin = `http://127.0.0.1:${address.port}`;
    const request = prepareRequest("POST", "/echo", '{"X-Test":"probe"}', '{"hello":"world"}');
    const response = await fetch(origin + request.url, request.init);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { body: { hello: "world" }, header: "probe" });
    const redirect = prepareRequest("GET", "/redirect", "{}", "");
    await assert.rejects(fetch(origin + redirect.url, redirect.init));
    const page = await fetch(origin);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /API console/);
  } finally {
    await ui.close();
    await api.close();
  }
});
