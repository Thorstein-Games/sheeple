/**
 * Game Server Configuration
 *
 * Returns the appropriate game server URL based on environment
 */

export function getGameServerUrl(): string {
  // Server-side (Node.js)
  if (typeof window === "undefined") {
    const isDev = process.env.NODE_ENV !== "production";
    const gamePort = process.env.GAME_PORT || "2567";

    if (isDev) {
      return `ws://localhost:${gamePort}`;
    } else {
      return process.env.GAME_SERVER_URL || "wss://megingjord.onrender.com";
    }
  }

  // Client-side (Browser)
  const isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isDev) {
    return "ws://localhost:2567";
  } else {
    // Production - use the Render.com game server
    return "wss://megingjord.onrender.com";
  }
}

export const GAME_CONFIG = {
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  DEFAULT_ROUNDS: 5,
  ROUND_DURATION: 30000, // 30 seconds
  RECONNECTION_WINDOW: 5 * 60 * 1000, // 5 minutes
} as const;
