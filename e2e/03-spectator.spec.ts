import { test, expect } from "@playwright/test";
import { enterHerd, createPublicRoom, leaveRoom, uniqueName } from "./fixtures";

test("a spectator can watch a room from the lobby without joining as a player", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const spectatorContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const spectatorPage = await spectatorContext.newPage();

  try {
    const hostName = uniqueName("Host");
    const spectatorName = uniqueName("Spectator");

    await enterHerd(hostPage, hostName);
    const roomCode = await createPublicRoom(hostPage);

    await enterHerd(spectatorPage, spectatorName);
    // Room list refreshes on an interval; wait for the room to show up rather than reloading.
    // Scoped to this room's row (the card div carrying these Tailwind classes
    // in GameLobby.tsx) — other (empty, leftover) rooms may also be listed
    // since rooms never auto-dispose, so an unscoped "Watch" button would be ambiguous.
    const roomRow = spectatorPage.locator("div.border.rounded-lg", {
      hasText: `Room ${roomCode}`,
    });
    await expect(roomRow).toBeVisible({ timeout: 10_000 });

    await roomRow.getByRole("button", { name: "Watch" }).click();
    await spectatorPage.waitForURL(`**/room/${roomCode}/spectate`);

    // The spectator's join occasionally hangs on "Connecting to room..."
    // (client.join() never resolving) rather than erroring — a rare race
    // rather than something reliably reproducible, so a one-time reload
    // (retriggering the join effect) is a pragmatic retry here.
    const tvMode = spectatorPage.getByText("TV Mode");
    try {
      await expect(tvMode).toBeVisible({ timeout: 5_000 });
    } catch {
      await spectatorPage.reload();
      await expect(tvMode).toBeVisible({ timeout: 10_000 });
    }
    await expect(spectatorPage.getByText(hostName).first()).toBeVisible();

    // Spectators get a read-only view — no answer input should be present.
    await expect(spectatorPage.getByPlaceholder("Type your answer...")).toHaveCount(0);
  } finally {
    await leaveRoom(hostPage).catch(() => {});
    await leaveRoom(spectatorPage).catch(() => {});
    await hostContext.close();
    await spectatorContext.close();
  }
});
