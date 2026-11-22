export const DEFAULT_VIDEO_ID = "tAfi0X-cJag";
export interface PlaybackEvent {
  state: "play" | "pause" | "seekTo";
  time: number;
}
export interface ChatMessage {
  username: string;
  payload: string;
}
export interface RoomState {
  videoId: string;
  time: number;
  playing: boolean;
}
export interface ServerEvents {
  event: (event: PlaybackEvent) => void;
  "new user": (username: string) => void;
  "chat message": (message: ChatMessage) => void;
  connection2: (message: string) => void;
  "load video": (videoId: string) => void;
  "room state": (room: RoomState) => void;
}
export interface ClientEvents {
  event: (event: PlaybackEvent) => void;
  "new user": (username: string) => void;
  "chat message": (message: ChatMessage) => void;
  "load video": (videoId: string) => void;
}
