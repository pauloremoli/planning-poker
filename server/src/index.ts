import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer } from "ws";
import { SignalingServer } from "./signaling/SignalingServer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 3001;

const app = express();

app.get("/healthz", (_req, res) => {
  res.status(200).send("ok");
});

if (isProduction) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
new SignalingServer(wss);

httpServer.listen(port, () => {
  console.log(`Signaling server listening on port ${port}${isProduction ? " (serving static client)" : ""}`);
});
