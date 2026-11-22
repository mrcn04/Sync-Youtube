import { useEffect, useRef, useState } from "react";
import type { PlaybackEvent, RoomState } from "../../shared/protocol";
import { formatTime } from "./utils";
interface YouTubePlayer {
  cueVideoById(id: string): void;
  loadVideoById(options: { videoId: string; startSeconds: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(time: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}
declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: object) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
let apiPromise: Promise<void> | undefined;
function loadApi() {
  if (window.YT?.Player) return Promise.resolve();
  return (apiPromise ??= new Promise((resolve, reject) => {
    window.onYouTubeIframeAPIReady = resolve;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () =>
      reject(
        new Error(
          "YouTube could not be reached. Check your connection and reload.",
        ),
      );
    document.head.append(script);
  }));
}
export default function Player({
  room,
  connected,
  onControl,
}: {
  room: RoomState;
  connected: boolean;
  onControl: (event: PlaybackEvent) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const latestRoom = useRef(room);
  latestRoom.current = room;
  const loadedVideo = useRef("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [draft, setDraft] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadApi()
      .then(() => {
        if (cancelled || !container.current || !window.YT) return;
        const mount = document.createElement("div");
        container.current.append(mount);
        player.current = new window.YT.Player(mount, {
          width: "100%",
          height: "100%",
          videoId: latestRoom.current.videoId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              if (!cancelled) setReady(true);
            },
            onError: () =>
              setError(
                "This video is unavailable or cannot be embedded. Try another YouTube link.",
              ),
            onAutoplayBlocked: () =>
              setError("Your browser blocked playback. Press Play to join in."),
          },
        });
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message);
      });
    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready || !player.current) return;
    const p = player.current;
    if (loadedVideo.current !== room.videoId) {
      loadedVideo.current = room.videoId;
      setError("");
      if (room.playing)
        p.loadVideoById({ videoId: room.videoId, startSeconds: room.time });
      else {
        p.cueVideoById(room.videoId);
        p.seekTo(room.time, true);
      }
    } else {
      p.seekTo(room.time, true);
      if (room.playing) p.playVideo();
      else p.pauseVideo();
    }
  }, [room, ready]);
  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      setPosition(player.current?.getCurrentTime() || 0);
      setDuration(player.current?.getDuration() || 0);
    }, 250);
    return () => clearInterval(timer);
  }, [ready]);
  function control(
    state: PlaybackEvent["state"],
    time = player.current?.getCurrentTime() || 0,
  ) {
    if (!player.current || !connected) return;
    // Apply in the user gesture too, so browser autoplay policies allow local playback.
    if (state === "play") {
      setError("");
      player.current.playVideo();
    }
    if (state === "pause") player.current.pauseVideo();
    if (state === "seekTo") player.current.seekTo(time, true);
    onControl({ state, time });
  }
  function commitSeek() {
    if (draft !== null) {
      control("seekTo", draft);
      setDraft(null);
    }
  }
  return (
    <section aria-label="Shared YouTube player" className="watch">
      <div className="video-shell">
        <div ref={container} className="video" />
        {!ready && (
          <p className="loading" role="status">
            Connecting to YouTube…
          </p>
        )}
      </div>
      <div className="controls">
        <button
          disabled={!ready || !connected}
          onClick={() => control("play")}
          aria-label="Play for everyone"
        >
          ▶ <span>Play</span>
        </button>
        <button
          className="secondary"
          disabled={!ready || !connected}
          onClick={() => control("pause")}
          aria-label="Pause for everyone"
        >
          Ⅱ <span>Pause</span>
        </button>
        <span className="time">{formatTime(draft ?? position)}</span>
        <input
          className="seek"
          aria-label="Seek video for everyone"
          type="range"
          min="0"
          max={duration || 1}
          step="0.1"
          value={Math.min(draft ?? position, duration || 1)}
          disabled={!ready || !connected || !duration}
          onChange={(event) => setDraft(Number(event.target.value))}
          onPointerUp={commitSeek}
          onKeyUp={commitSeek}
          onBlur={commitSeek}
        />
        <span className="time">{formatTime(duration)}</span>
      </div>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <p className="player-hint">
        Shared controls · Play, pause, and seek change the video for everyone.
      </p>
    </section>
  );
}
