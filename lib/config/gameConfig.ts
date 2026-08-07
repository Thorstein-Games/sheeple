export function getGameServerUrl(): string {
  const isDev =
    typeof window !== "undefined"
      ? window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      : process.env.NODE_ENV !== "production";

  if (isDev) {
    return "ws://localhost:2567";
  }

  return process.env.NEXT_PUBLIC_GAME_SERVER_URL || "wss://megingjord.onrender.com";
}

export const GAME_CONFIG = {
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  DEFAULT_ROUNDS: 5,
  ROUND_DURATION: 30000, // 30 seconds
  RECONNECTION_WINDOW: 5 * 60 * 1000, // 5 minutes
} as const;
