export function prepareRequest(method: string, path: string, headersText: string, body: string) {
  // Accept only local paths. Reject normalization that could leave the API proxy.
  if (!path.startsWith("/") || path.startsWith("//") || /[\\\s#]/.test(path)) {
    throw new Error("Use a local path beginning with one slash, such as /health.");
  }
  const url = new URL(`/api${path}`, "http://local.invalid");
  if (!url.pathname.startsWith("/api/")) throw new Error("Path must stay within the local API.");
  const parsed: unknown = JSON.parse(headersText.trim() || "{}");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
      Object.values(parsed).some(value => typeof value !== "string")) {
    throw new Error("Headers must be a JSON object with string values.");
  }
  const headers = new Headers(parsed as Record<string, string>);
  const hasBody = method !== "GET" && method !== "HEAD" && body.trim() !== "";
  if (hasBody) {
    JSON.parse(body);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }
  return {
    url: url.pathname + url.search,
    init: { method, headers, ...(hasBody ? { body } : {}), credentials: "omit", redirect: "error" } satisfies RequestInit,
  };
}
