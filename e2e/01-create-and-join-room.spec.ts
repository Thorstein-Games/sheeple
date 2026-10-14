import { test, expect } from "@playwright/test";
import {
  enterHerd,
  createPublicRoom,
  joinRoomByCode,
  leaveRoom,
  uniqueName,
} from "./fixtures";

test("host creates a public room and a guest joins it by code", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  try {
    const hostName = uniqueName("Host");
    const guestName = uniqueName("Guest");

    await enterHerd(hostPage, hostName);
    const roomCode = await createPublicRoom(hostPage);

    await expect(hostPage.getByText(roomCode, { exact: false }).first()).toBeVisible();
    await expect(hostPage.getByText(hostName).first()).toBeVisible();

    await enterHerd(guestPage, guestName);
    await joinRoomByCode(guestPage, roomCode);

    // Guest's own join fetches a fresh snapshot, so it already includes the host.
    await expect(guestPage.getByText(hostName).first()).toBeVisible();
    await expect(guestPage.getByText(guestName).first()).toBeVisible();

    // The host sees the guest arrive live, without a reload.
    await expect(hostPage.getByText(guestName).first()).toBeVisible();
    await expect(hostPage.getByText("Players in Room (2/")).toBeVisible();
  } finally {
    // Always leave cleanly (even on assertion failure) so the room is empty
    // for the next test's quickplay match — see leaveRoom() in fixtures.ts.
    await leaveRoom(hostPage).catch(() => {});
    await leaveRoom(guestPage).catch(() => {});
    await hostContext.close();
    await guestContext.close();
  }
});
