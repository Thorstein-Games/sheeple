import { expect, type Page } from "@playwright/test";

/** Unique-enough player name so parallel workers/tests don't collide on playerId/localStorage. */
export function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** Enters a name on the home page and lands on /lobby. */
export async function enterHerd(page: Page, name: string): Promise<void> {
  await page.goto("/");
  const nameInput = page.getByPlaceholder("Your name");
  // Wait for the app to pre-fill its stored/random name: that means React has
  // hydrated. Typing earlier gets wiped by hydration, and the random name is
  // what gets submitted (an intermittent "player not found" in later steps).
  await expect(nameInput).not.toHaveValue("");
  await nameInput.fill(name);
  await page.getByRole("button", { name: "Join the Herd →" }).click();
  await page.waitForURL("**/lobby");
}

/** From /lobby, creates a new public room and returns the room code parsed from the URL. */
export async function createPublicRoom(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Create Public Room" }).click();
  await page.waitForURL(/\/room\/[A-Z0-9]+$/);
  const match = page.url().match(/\/room\/([A-Z0-9]+)$/);
  if (!match) throw new Error(`Could not parse room code from URL: ${page.url()}`);
  return match[1];
}

/**
 * KNOWN BUG (see ColyseusProvider's `setPendingGameRoom`/`consumeSeatReservation`
 * patch, and CLAUDE.md's warning about that version-bridging shim): Colyseus
 * state *patches* never appear to apply on the client — `player_joined` etc.
 * still arrive as messages and get logged, but reading `state.players`
 * afterwards still reflects the snapshot from whenever this connection was
 * established, not any later join/leave/ready/score change. Only the full
 * snapshot fetched at join (or reload) time is ever accurate. So: reload a
 * page immediately before asserting on anything driven by a *different*
 * client's action. This works around it for tests; the underlying bug means
 * real players currently don't see each other's actions live either, without
 * a refresh, and is worth a real fix outside this test-writing task.
 */
export async function refreshRoomState(page: Page): Promise<void> {
  await page.reload();
  await page.getByText("Waiting for Players...").waitFor();
}

/** From /lobby, joins an existing room by its code. */
export async function joinRoomByCode(page: Page, code: string): Promise<void> {
  await page.getByPlaceholder("Leave blank to create new room").fill(code);
  await page.getByRole("button", { name: `Join Room ${code}` }).click();
  await page.waitForURL(`**/room/${code}`);
}

/**
 * Rooms never auto-dispose (see BaseGameRoom's `autoDispose = false`, kept
 * alive to support reconnection), and public rooms are joined via Colyseus
 * quickplay matchmaking with no room-code filter — so a leftover room from a
 * previous test can otherwise get matched into by the next test's host. And
 * if a player's leave isn't registered as *consented*, the server holds their
 * seat for a 15-minute disconnect grace period (BaseGameRoom's
 * `disconnectedTimeout`) — far longer than this whole suite — so a sloppy
 * leave here pollutes every later test.
 *
 * Use the app's own "Go back" nav button (an in-app client-side route change)
 * rather than `page.goto("/lobby")`. `goto` forces a hard browser navigation,
 * which can tear down the JS context — and the in-flight `room.leave()`
 * WebSocket send — before the consented close actually reaches the server.
 */
export async function leaveRoom(page: Page): Promise<void> {
  const goBack = page.getByRole("button", { name: "Go back" });
  if (await goBack.isVisible().catch(() => false)) {
    await goBack.click();
    await page.waitForURL("**/lobby");
  } else {
    await page.goto("/lobby");
  }
  // Give the server a moment to process the consented leave (and dispose the
  // room, if now empty) before the caller closes the browser context.
  await page.waitForTimeout(500);
}
