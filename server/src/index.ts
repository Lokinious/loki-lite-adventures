import http from "node:http";
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
const gameServer = new Server({ server: httpServer });

gameServer.define("lobby", LobbyRoom).filterBy(["roomCode"]);

const port = Number(process.env.PORT ?? 2567);

gameServer.listen(port);

console.log(`Loki Lite Adventures server listening on port ${port}`);
