import http from "node:http";
import { WebSocketTransport } from "@colyseus/ws-transport";
import cors from "cors";
import express from "express";
import colyseus from "colyseus";
import { LobbyRoom } from "./rooms/LobbyRoom.js";

const { Server } = colyseus;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

const httpServer = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer
  })
});

gameServer.define("lobby", LobbyRoom).filterBy(["roomCode"]);

const port = Number(process.env.PORT ?? 2567);

httpServer.once("error", (error) => {
  if ("code" in error && error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the existing server or set PORT to a different value.`);
    process.exitCode = 1;
    return;
  }

  console.error(error);
  process.exitCode = 1;
});

httpServer.listen(port, () => {
  console.log(`Loki Lite Adventures server listening on port ${port}`);
});
