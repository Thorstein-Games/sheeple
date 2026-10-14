/**
 * The sub-path the site is served from: "" on sheeple-game.com, "/sheeple"
 * for the copy served at thorsteingames.com/sheeple (set at build time via
 * NEXT_PUBLIC_BASE_PATH; see next.config.ts and scripts/build-netlify.mjs).
 *
 * next/link and router.push add it automatically. Raw asset paths (<img>,
 * CSS url()), share URLs and window.location parsing must go through here.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** A file from public/, e.g. asset("/sheep.png"). */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}

/** window.location.pathname without the base path. */
export function appPathname(): string {
  const path = window.location.pathname;
  return BASE_PATH && path.startsWith(BASE_PATH) ? path.slice(BASE_PATH.length) || "/" : path;
}

/** The shareable link to a room. */
export function roomUrl(roomCode: string): string {
  return `${window.location.origin}${BASE_PATH}/room/${roomCode}`;
}
