import { describe, expect, it } from "vitest";
import {
  formatTime,
  getUsernameColor,
  getUsernameBackground,
  parseVideoId,
} from "./utils";
describe("video URL parsing", () => {
  it.each([
    "tAfi0X-cJag",
    "https://www.youtube.com/watch?v=tAfi0X-cJag&list=abc",
    "https://youtu.be/tAfi0X-cJag?t=30",
    "https://youtube.com/shorts/tAfi0X-cJag",
    "https://youtube.com/embed/tAfi0X-cJag",
    "https://m.youtube.com/watch?v=tAfi0X-cJag",
    "https://youtube.com/live/tAfi0X-cJag",
  ])("accepts %s", (input) => expect(parseVideoId(input)).toBe("tAfi0X-cJag"));
  it.each([
    "",
    "bad",
    "javascript:alert(1)",
    "https://evil.test/watch?v=tAfi0X-cJag",
    "https://youtube.com.evil.test/watch?v=tAfi0X-cJag",
    "https://youtube.com/watch?v=bad",
  ])("rejects %s", (input) => expect(parseVideoId(input)).toBeNull());
});
describe("legacy username colors", () => {
  it("preserves original hash colors", () => {
    expect(getUsernameColor("Alice")).toBe("#287b00");
    expect(getUsernameColor("Bob")).toBe("#a8f07a");
    expect(getUsernameColor("")).toBe("#4ae8c4");
  });
  it("uses a light ground for dark legacy colors and dark ground for bright colors", () => {
    expect(getUsernameBackground("Alice")).toBe("#edf1f3");
    expect(getUsernameBackground("Bob")).toBe("#101519");
  });
  it("is stable for long unicode names", () => {
    const name = "Ömür😀".repeat(20);
    expect(getUsernameColor(name)).toMatch(/^#[0-9a-f]{6}$/);
    expect(getUsernameColor(name)).toBe(getUsernameColor(name));
  });
});
describe("time formatting", () => {
  it.each([
    [0, "0:00"],
    [65.9, "1:05"],
    [3600, "60:00"],
    [-5, "0:00"],
  ])("formats %s", (seconds, result) =>
    expect(formatTime(Number(seconds))).toBe(result),
  );
});
