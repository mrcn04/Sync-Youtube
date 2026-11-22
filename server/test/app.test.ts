import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { io as connect, type Socket } from "socket.io-client";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app";
import { DEFAULT_VIDEO_ID } from "../../shared/protocol";

describe("Socket.IO room", () => {
  let server: ReturnType<typeof createApp>;
  let url: string;
  const clients: Socket[] = [];
  function next<T = unknown>(socket: Socket, event: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        socket.off(event, receive);
        reject(new Error(`Missing ${event}`));
      }, 1500);
      function receive(value: T) {
        clearTimeout(timer);
        resolve(value);
      }
      socket.once(event, receive);
    });
  }
  async function client() {
    const socket = connect(url, { forceNew: true, autoConnect: false });
    clients.push(socket);
    const state = next(socket, "room state");
    socket.connect();
    return { socket, state: await state };
  }
  beforeEach(async () => {
    server = createApp();
    await new Promise<void>((resolve) =>
      server.httpServer.listen(0, "127.0.0.1", resolve),
    );
    url = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}`;
  });
  afterEach(async () => {
    clients.splice(0).forEach((socket) => socket.disconnect());
    await new Promise<void>((resolve) => server.io.close(() => resolve()));
  });
  it("provides a paused default video on connection", async () => {
    expect((await client()).state).toEqual({
      videoId: DEFAULT_VIDEO_ID,
      time: 0,
      playing: false,
    });
  });
  it.each(["play", "pause", "seekTo"])(
    "broadcasts %s to sender and peer",
    async (state) => {
      const { socket: alice } = await client();
      const { socket: bob } = await client();
      const sender = next(alice, "event");
      const peer = next(bob, "event");
      const message = { state, time: 42.5 };
      alice.emit("event", message);
      expect(await sender).toEqual(message);
      expect(await peer).toEqual(message);
    },
  );
  it("broadcasts new user and the original welcome message", async () => {
    const { socket: alice } = await client();
    const { socket: bob } = await client();
    const joined = next(bob, "new user");
    const welcome = next(bob, "connection2");
    alice.emit("new user", "Alice");
    expect(await joined).toBe("Alice");
    expect(await welcome).toBe("Welcome to Ömür's Chatbox Alice");
  });
  it("broadcasts chat to sender and peer with socket-bound identity", async () => {
    const { socket: alice } = await client();
    const { socket: bob } = await client();
    const joined = next(alice, "new user");
    alice.emit("new user", "Alice");
    await joined;
    const sender = next(alice, "chat message");
    const peer = next(bob, "chat message");
    alice.emit("chat message", {
      username: "Impersonated",
      payload: " Hello! ",
    });
    expect(await sender).toEqual({ username: "Alice", payload: "Hello!" });
    expect(await peer).toEqual({ username: "Alice", payload: "Hello!" });
  });
  it("broadcasts video changes and retains them for late joiners", async () => {
    const { socket: alice } = await client();
    const { socket: bob } = await client();
    const loaded = next(bob, "load video");
    alice.emit("load video", "dQw4w9WgXcQ");
    expect(await loaded).toBe("dQw4w9WgXcQ");
    expect((await client()).state).toEqual({
      videoId: "dQw4w9WgXcQ",
      time: 0,
      playing: false,
    });
  });
  it("restores paused time after play, seek, pause for late joiners", async () => {
    const { socket: alice } = await client();
    for (const event of [
      { state: "play", time: 10 },
      { state: "seekTo", time: 20 },
      { state: "pause", time: 30 },
    ]) {
      const echoed = next(alice, "event");
      alice.emit("event", event);
      await echoed;
    }
    expect((await client()).state).toEqual({
      videoId: DEFAULT_VIDEO_ID,
      time: 30,
      playing: false,
    });
  });
  it("estimates elapsed time for late joiners while playing", async () => {
    const { socket: alice } = await client();
    const echoed = next(alice, "event");
    alice.emit("event", { state: "play", time: 50 });
    await echoed;
    const state = (await client()).state as { time: number; playing: boolean };
    expect(state.playing).toBe(true);
    expect(state.time).toBeGreaterThanOrEqual(50);
    expect(state.time).toBeLessThan(52);
  });
  it("ignores malformed or unsafe inputs without broadcasting", async () => {
    const { socket: alice } = await client();
    const { socket: bob } = await client();
    const received: unknown[] = [];
    for (const event of ["event", "load video", "new user", "chat message"])
      bob.on(event, (value) => received.push(value));
    for (const value of [
      null,
      {},
      { state: "stop", time: 1 },
      { state: "play", time: -1 },
      { state: "play", time: "1" },
      { state: "pause", time: 604801 },
    ])
      alice.emit("event", value);
    alice.emit("load video", "<script>");
    alice.emit("new user", " ");
    alice.emit("new user", "x".repeat(33));
    alice.emit("chat message", {
      username: "Anonymous",
      payload: "Not joined",
    });
    // A valid event on the same connection is an ordering barrier.
    const barrier = next(alice, "event");
    alice.emit("event", { state: "pause", time: 0 });
    await barrier;
    // Peer receipt is also an ordering barrier for prior broadcasts.
    const peerBarrier = next(bob, "event");
    alice.emit("event", { state: "pause", time: 1 });
    await peerBarrier;
    expect(received.filter((item: any) => item.state !== "pause")).toEqual([]);
    expect((await client()).state).toEqual({
      videoId: DEFAULT_VIDEO_ID,
      time: 1,
      playing: false,
    });
  });
  it("rejects blank and oversized chat after joining", async () => {
    const { socket: alice } = await client();
    const { socket: bob } = await client();
    const joined = next(alice, "new user");
    alice.emit("new user", "Alice");
    await joined;
    const received: unknown[] = [];
    bob.on("chat message", (message) => received.push(message));
    alice.emit("chat message", { payload: " " });
    alice.emit("chat message", { payload: "x".repeat(2001) });
    const valid = next(bob, "chat message");
    alice.emit("chat message", { payload: "ok" });
    await valid;
    expect(received).toEqual([{ username: "Alice", payload: "ok" }]);
  });
});
