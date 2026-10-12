import { defineConfig } from "vite";

const apiPort = Number(process.env.PORT ?? "3000");
const uiPort = Number(process.env.UI_PORT ?? "5173");
for (const [name, port] of [["PORT", apiPort], ["UI_PORT", uiPort]] as const) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be an integer from 1 to 65535`);
  }
}
if (apiPort === uiPort) throw new Error("PORT and UI_PORT must be different");

export default defineConfig({
  root: "ui",
  server: {
    host: "127.0.0.1",
    port: uiPort,
    strictPort: true,
    proxy: {
      "^/api(?:/|$|\\?)": {
        target: `http://127.0.0.1:${apiPort}`,
        rewrite: (path) => path.replace(/^\/api/, "") || "/",
        followRedirects: false,
      },
    },
  },
  build: { outDir: "../dist/ui", emptyOutDir: true },
});
