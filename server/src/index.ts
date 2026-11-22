import { createApp } from "./app.js";
const { httpServer, io } = createApp();
const port = Number(process.env.PORT || 4000);
httpServer.listen(port, "0.0.0.0", () =>
  console.log(`Sync YouTube listening on http://localhost:${port}`),
);
function shutdown() {
  io.close(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
