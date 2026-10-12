import Fastify from "fastify";

export function createApp() {
  const app = Fastify();
  app.get("/health", async () => ({ status: "ok" }));
  app.setNotFoundHandler(async (_request, reply) => {
    return reply.code(404).send({ error: "not_found" });
  });
  return app;
}
