import { useEffect, useRef, useState, type FormEvent } from "react";
import { io, type Socket } from "socket.io-client";
import {
  DEFAULT_VIDEO_ID,
  type ServerEvents,
  type ClientEvents,
  type RoomState,
} from "../../shared/protocol";
import Player from "./Player";
import { getUsernameColor, getUsernameBackground, parseVideoId } from "./utils";
type Message = { id: number; username?: string; payload: string };
export default function App() {
  const socket = useRef<Socket<ServerEvents, ClientEvents> | null>(null);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState(
    () => sessionStorage.getItem("sync-username") || "",
  );
  const name = useRef(username);
  const [nameDraft, setNameDraft] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const nextId = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);
  const [videoInput, setVideoInput] = useState("");
  const [videoError, setVideoError] = useState("");
  const [room, setRoom] = useState<RoomState>({
    videoId: DEFAULT_VIDEO_ID,
    time: 0,
    playing: false,
  });
  useEffect(() => {
    const client: Socket<ServerEvents, ClientEvents> = io();
    socket.current = client;
    const append = (entry: Omit<Message, "id">) =>
      setMessages((all) => [
        ...all.slice(-199),
        { ...entry, id: nextId.current++ },
      ]);
    client.on("connect", () => {
      setConnected(true);
      if (name.current) client.emit("new user", name.current);
    });
    client.on("disconnect", () => setConnected(false));
    client.on("connect_error", () => setConnected(false));
    client.on("room state", setRoom);
    client.on("event", (event) =>
      setRoom((current) => ({
        ...current,
        time: event.time,
        playing:
          event.state === "seekTo" ? current.playing : event.state === "play",
      })),
    );
    client.on("load video", (videoId) =>
      setRoom({ videoId, time: 0, playing: false }),
    );
    client.on("connection2", (payload) => append({ payload }));
    client.on("chat message", ({ username, payload }) =>
      append({ username, payload }),
    );
    return () => {
      client.disconnect();
      socket.current = null;
    };
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);
  function join(event: FormEvent) {
    event.preventDefault();
    const value = nameDraft.trim();
    if (!value || !connected) return;
    name.current = value;
    setUsername(value);
    sessionStorage.setItem("sync-username", value);
    socket.current?.emit("new user", value);
  }
  function send(event: FormEvent) {
    event.preventDefault();
    if (!username || !message.trim() || !connected) return;
    socket.current?.emit("chat message", { username, payload: message.trim() });
    setMessage("");
  }
  function loadVideo(event: FormEvent) {
    event.preventDefault();
    const videoId = parseVideoId(videoInput);
    if (!videoId) {
      setVideoError("Enter a valid YouTube URL or 11-character video ID.");
      return;
    }
    if (!connected) return;
    socket.current?.emit("load video", videoId);
    setVideoInput("");
    setVideoError("");
  }
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            ▶
          </span>{" "}
          Sync YouTube
        </a>
        <span
          className={`connection ${connected ? "online" : ""}`}
          role="status"
        >
          <i />
          {connected ? "Connected" : "Reconnecting…"}
        </span>
      </header>
      <main>
        <div className="intro">
          <div>
            <p className="eyebrow">The shared room</p>
            <h1>
              Good videos.
              <br />
              Better together.
            </h1>
          </div>
          <p>
            Pick something to watch.
            <br />
            Everyone gets the same moment.
          </p>
        </div>
        <div className="room-layout">
          <div className="stage">
            <Player
              room={room}
              connected={connected}
              onControl={(event) => socket.current?.emit("event", event)}
            />
            <section className="video-picker" aria-labelledby="next-video">
              <div>
                <h2 id="next-video">What’s on next?</h2>
                <p>Load a video for the whole room.</p>
              </div>
              <form onSubmit={loadVideo}>
                <label className="sr-only" htmlFor="video-url">
                  YouTube URL or video ID
                </label>
                <input
                  id="video-url"
                  value={videoInput}
                  onChange={(e) => setVideoInput(e.target.value)}
                  placeholder="Paste a YouTube link or video ID"
                  required
                />
                <button disabled={!connected}>Load video</button>
              </form>
              {videoError && (
                <p className="notice" role="alert">
                  {videoError}
                </p>
              )}
            </section>
            <p className="room-note">
              One shared room. Send this page’s link to a friend to watch
              together.
            </p>
          </div>
          <aside className="chat" aria-labelledby="chat-heading">
            <div className="chat-heading">
              <h2 id="chat-heading">Room chat</h2>
              <span>Live conversation</span>
            </div>
            <div
              className="messages"
              role="log"
              aria-label="Chat messages"
              aria-live="polite"
            >
              {messages.length === 0 && (
                <div className="chat-empty">
                  <span aria-hidden="true">↗</span>
                  <h3>A little company.</h3>
                  <p>
                    Share a thought, a reaction,
                    <br />
                    or your next great find.
                  </p>
                </div>
              )}
              {messages.map((entry) => (
                <div
                  key={entry.id}
                  className={entry.username ? "message" : "system-message"}
                >
                  {entry.username && (
                    <strong
                      style={{
                        color: getUsernameColor(entry.username),
                        background: getUsernameBackground(entry.username),
                      }}
                    >
                      {entry.username}
                    </strong>
                  )}
                  <p>{entry.payload}</p>
                </div>
              ))}
              <div ref={bottom} />
            </div>
            {!username ? (
              <form className="chat-form join-form" onSubmit={join}>
                <label htmlFor="username">Choose a name to join the chat</label>
                <div className="input-row">
                  <input
                    id="username"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="Your name"
                    maxLength={32}
                    required
                  />
                  <button disabled={!connected || !nameDraft.trim()}>
                    Join
                  </button>
                </div>
              </form>
            ) : (
              <form className="chat-form" onSubmit={send}>
                <label htmlFor="message">
                  Chatting as <strong>{username}</strong>
                </label>
                <div className="input-row">
                  <input
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Say something…"
                    maxLength={2000}
                    required
                    autoComplete="off"
                  />
                  <button
                    disabled={!connected || !message.trim()}
                    aria-label="Send message"
                  >
                    Send
                  </button>
                </div>
              </form>
            )}
          </aside>
        </div>
      </main>
      <footer>
        Made for watching together.
        <span>
          YouTube playback is subject to availability and browser autoplay
          settings.
        </span>
      </footer>
    </div>
  );
}
