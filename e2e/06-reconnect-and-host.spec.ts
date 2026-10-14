import { test, expect } from "@playwright/test";
import {
  enterHerd,
  createPublicRoom,
  joinRoomByCode,
  leaveRoom,
  refreshRoomState,
  uniqueName,
} from "./fixtures";

// megingjord's BaseGameRoom treats a rejoin by name as a reconnect, and hands
// the room to someone else when the host leaves. Both are shared with every
// other game on the server, so they're worth guarding from each client.

test("reloading keeps your seat, without a duplicate player", async ({ browser }) => {
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

    // Both reload; each comes back to the same room as the same player.
    await refreshRoomState(guestPage);
    await refreshRoomState(hostPage);
    expect(hostPage.url()).toContain(`/room/${roomCode}`);
    await expect(hostPage.getByText("Players in Room (2/")).toBeVisible();
    await expect(hostPage.getByText(guestName)).toHaveCount(1);

    // The host is still the host.
    await expect(hostPage.locator(".group", { hasText: hostName }).getByTitle("Room Host")).toBeVisible();
    await expect(hostPage.locator(".group", { hasText: guestName }).getByTitle("Kick player")).toBeVisible();
  } finally {
    await leaveRoom(guestPage).catch(() => {});
    await leaveRoom(hostPage).catch(() => {});
    await hostContext.close();
    await guestContext.close();
  }
});

test("when the host leaves, another player becomes host", async ({ browser }) => {
  const contexts = await Promise.all([browser.newContext(), browser.newContext(), browser.newContext()]);
  const [hostPage, aPage, bPage] = await Promise.all(contexts.map((c) => c.newPage()));

  try {
    const hostName = uniqueName("Host");
    const aName = uniqueName("Ann");
    const bName = uniqueName("Ben");

    await enterHerd(hostPage, hostName);
    const roomCode = await createPublicRoom(hostPage);
    await enterHerd(aPage, aName);
    await joinRoomByCode(aPage, roomCode);
    await enterHerd(bPage, bName);
    await joinRoomByCode(bPage, roomCode);

    await leaveRoom(hostPage);

    await refreshRoomState(aPage);
    await expect(aPage.getByText("Players in Room (2/")).toBeVisible();
    await expect(aPage.getByText(hostName)).toHaveCount(0);
    const crowned = aPage.getByTitle("Room Host");
    await expect(crowned).toHaveCount(1);
    const newHost = (await aPage.locator(".group", { has: crowned }).innerText()).includes(aName) ? aPage : bPage;
    const other = newHost === aPage ? bName : aName;

    // Only the new host gets host controls.
    await refreshRoomState(newHost);
    await expect(newHost.locator(".group", { hasText: other }).getByTitle("Kick player")).toBeVisible();
  } finally {
    await leaveRoom(aPage).catch(() => {});
    await leaveRoom(bPage).catch(() => {});
    await Promise.all(contexts.map((c) => c.close()));
  }
});
