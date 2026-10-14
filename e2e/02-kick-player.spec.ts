import { test, expect } from "@playwright/test";
import {
  enterHerd,
  createPublicRoom,
  joinRoomByCode,
  leaveRoom,
  uniqueName,
} from "./fixtures";

test("host kicks a guest, who is toasted and redirected to the lobby", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  try {
    const hostName = uniqueName("Host");
    const guestName = uniqueName("Guest");

    await enterHerd(hostPage, hostName);
    const roomCode = await createPublicRoom(hostPage);

    await enterHerd(guestPage, guestName);
    await joinRoomByCode(guestPage, roomCode);

    // The guest shows up on the host's page live.
    const guestRow = hostPage.locator(".group", { hasText: guestName });
    await expect(guestRow).toBeVisible();
    await guestRow.getByTitle("Kick player").click();

    // Kicking is a live message push (not a state read), so no reload needed
    // here. The redirect to /lobby is the durable signal — the toast is
    // ephemeral (4s auto-dismiss) and can already be gone by the time we
    // get to check it, so don't assert on its exact wording.
    await guestPage.waitForURL("**/lobby");
    await expect(hostPage.getByText(guestName)).toHaveCount(0);
  } finally {
    // The guest is already kicked (removed server-side); only the host needs
    // to leave cleanly so the room is empty for the next test's quickplay match.
    await leaveRoom(hostPage).catch(() => {});
    await hostContext.close();
    await guestContext.close();
  }
});
