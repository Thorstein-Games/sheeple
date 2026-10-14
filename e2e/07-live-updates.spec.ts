import { test, expect } from "@playwright/test";
import { enterHerd, createPublicRoom, joinRoomByCode, leaveRoom, uniqueName } from "./fixtures";

// Every player (and spectator) sees the others' actions as they happen, with
// no reload: joins, ready toggles and leaves all arrive as state patches.

test("joins, ready toggles and leaves show up live for everyone", async ({ browser }) => {
  const contexts = await Promise.all([1, 2, 3, 4].map(() => browser.newContext()));
  const [hostPage, guestPage, thirdPage, spectatorPage] = await Promise.all(contexts.map((c) => c.newPage()));

  try {
    const hostName = uniqueName("Host");
    const guestName = uniqueName("Guest");

    await enterHerd(hostPage, hostName);
    const roomCode = await createPublicRoom(hostPage);

    // A spectator watches from the start.
    await spectatorPage.goto(`/room/${roomCode}/spectate`);
    await expect(spectatorPage.getByText("TV Mode")).toBeVisible({ timeout: 10_000 });
    await expect(spectatorPage.getByText(hostName).first()).toBeVisible();

    await enterHerd(guestPage, guestName);
    await joinRoomByCode(guestPage, roomCode);

    // Join.
    await expect(hostPage.locator(".group", { hasText: guestName })).toBeVisible();
    await expect(spectatorPage.getByText(guestName).first()).toBeVisible();

    // Ready needs three players.
    const thirdName = uniqueName("Third");
    await enterHerd(thirdPage, thirdName);
    await joinRoomByCode(thirdPage, roomCode);
    await expect(hostPage.getByText("Players in Room (3/")).toBeVisible();

    // Ready toggles, both ways.
    const guestRowOnHost = hostPage.locator(".group", { hasText: guestName });
    await guestPage.getByRole("button", { name: "Ready", exact: true }).click();
    await expect(guestRowOnHost.getByText("✓ Ready")).toBeVisible();
    await hostPage.getByRole("button", { name: "Ready", exact: true }).click();
    await expect(guestPage.locator(".group", { hasText: hostName }).getByText("✓ Ready")).toBeVisible();

    // Leave.
    await leaveRoom(guestPage);
    await expect(hostPage.getByText(guestName)).toHaveCount(0);
    await expect(hostPage.getByText("Players in Room (2/")).toBeVisible();
    await expect(spectatorPage.getByText(guestName)).toHaveCount(0);
  } finally {
    await leaveRoom(guestPage).catch(() => {});
    await leaveRoom(thirdPage).catch(() => {});
    await leaveRoom(hostPage).catch(() => {});
    await Promise.all(contexts.map((c) => c.close()));
  }
});
