import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { Server } from "socket.io";
import {
  DEFAULT_VIDEO_ID,
  type ClientEvents,
  type ServerEvents,
  type PlaybackEvent,
} from "../../shared/protocol.js";

export function createApp(
  clientDir = fileURLToPath(
    new URL(
      import.meta.url.endsWith(".js")
        ? "../../../../client/dist/"
        : "../../client/dist/",
      import.meta.url,
    ),
  ),
) {
  const app = express();
  app.disable("x-powered-by");
  const httpServer = createServer(app);
  const io = new Server<ClientEvents, ServerEvents>(httpServer, {
    maxHttpBufferSize: 16_384,
  });
  let videoId = DEFAULT_VIDEO_ID;
  let time = 0;
  let playing = false;
  let updatedAt = Date.now();
  const currentTime = () =>
    time + (playing ? (Date.now() - updatedAt) / 1000 : 0);
  io.on("connection", (socket) => {
    let username: string | undefined;
    socket.emit("room state", { videoId, time: currentTime(), playing });
    socket.on("new user", (value: unknown) => {
      if (typeof value !== "string" || !value.trim() || value.length > 32)
        return;
      username = value.trim();
      io.emit("new user", username);
      io.emit("connection2", `Welcome to Ömür's Chatbox ${username}`);
    });
    socket.on("chat message", (message: unknown) => {
      if (!username || !message || typeof message !== "object") return;
      const payload = (message as { payload?: unknown }).payload;
      if (
        typeof payload !== "string" ||
        !payload.trim() ||
        payload.length > 2000
      )
        return;
      // Identity belongs to the socket, not an untrusted field in the message.
      io.emit("chat message", { username, payload: payload.trim() });
    });
    socket.on("event", (message: unknown) => {
      if (!message || typeof message !== "object") return;
      const { state, time: nextTime } = message as PlaybackEvent;
      if (
        !["play", "pause", "seekTo"].includes(state) ||
        typeof nextTime !== "number" ||
        !Number.isFinite(nextTime) ||
        nextTime < 0 ||
        nextTime > 604800
      )
        return;
      time = nextTime;
      updatedAt = Date.now();
      if (state !== "seekTo") playing = state === "play";
      io.emit("event", { state, time });
    });
    socket.on("load video", (value: unknown) => {
      if (typeof value !== "string" || !/^[\w-]{11}$/.test(value)) return;
      videoId = value;
      time = 0;
      playing = false;
      updatedAt = Date.now();
      io.emit("load video", videoId);
    });
  });
  app.use(express.static(clientDir));
  // Express 5 requires a named wildcard; braces include the root route.
  app.get("/{*path}", (_req, res) =>
    res.sendFile(resolve(clientDir, "index.html")),
  );
  return { app, httpServer, io };
}
