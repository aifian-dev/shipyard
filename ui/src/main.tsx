import { useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { prepareRequest } from "./request";
import "./style.css";

function App() {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/health");
  const [headers, setHeaders] = useState("{}");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ status: string; body: string; elapsed: number }>();
  const [error, setError] = useState("");

  async function send(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResult(undefined);
    setPending(true);
    const start = performance.now();
    try {
      const request = prepareRequest(method, path, headers, body);
      const response = await fetch(request.url, { ...request.init, signal: AbortSignal.timeout(15_000) });
      const text = await response.text();
      let display = text || "(empty response)";
      try { display = JSON.stringify(JSON.parse(text), null, 2); } catch { /* Keep plain-text responses. */ }
      setResult({ status: `${response.status} ${response.statusText}`.trim(), body: display, elapsed: Math.round(performance.now() - start) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setPending(false); }
  }

  return <main>
    <header><span className="eyebrow">SHIPYARD / LOCAL WORKSPACE</span><h1>API console</h1>
      <p>A small workbench for your local service. The UI is optional.</p></header>
    <form onSubmit={send}>
      <div className="request-line">
        <label>Method<select value={method} onChange={e => setMethod(e.target.value)}>
          {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map(m => <option key={m}>{m}</option>)}
        </select></label>
        <label className="path">Path<input value={path} onChange={e => setPath(e.target.value)} spellCheck={false} required /></label>
        <button disabled={pending} type="submit">{pending ? "Sending…" : "Send request"}</button>
      </div>
      <div className="editors">
        <label>Headers <span>JSON object · optional</span><textarea value={headers} onChange={e => setHeaders(e.target.value)} spellCheck={false} /></label>
        <label>Body <span>{method === "GET" || method === "HEAD" ? "Not sent for this method" : "JSON · optional"}</span><textarea value={body} onChange={e => setBody(e.target.value)} disabled={method === "GET" || method === "HEAD"} spellCheck={false} placeholder="{}" /></label>
      </div>
      <p className="hint">Requests go to the local API through /api. Inputs stay in memory and reset when you reload. Use test data only.</p>
    </form>
    <section aria-label="Response" aria-live="polite">
      <div className="response-heading"><h2>Response</h2>{result && <span>{result.status} · {result.elapsed} ms</span>}</div>
      {error ? <p role="alert">{error}</p> : <pre>{result?.body ?? "Send a request to see its response here."}</pre>}
    </section>
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);
