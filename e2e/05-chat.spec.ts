import { test, expect, type Page } from "@playwright/test";
import { enterHerd, createPublicRoom, joinRoomByCode, leaveRoom, uniqueName } from "./fixtures";

async function sendChat(page: Page, text: string) {
  await page.getByRole("button", { name: "Toggle chat" }).click();
  await page.getByPlaceholder("Type a message...").fill(text);
  await page.getByRole("button", { name: "Send" }).click();
}

test("room chat is delivered live and replayed to players who join later", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  try {
    const hostName = uniqueName("Host");
    const guestName = uniqueName("Guest");

    await enterHerd(hostPage, hostName);
    const roomCode = await createPublicRoom(hostPage);
    await sendChat(hostPage, "said before you arrived");
    await expect(hostPage.getByText("said before you arrived")).toBeVisible();

    // The guest wasn't there yet; the room's chat history brings it in.
    await enterHerd(guestPage, guestName);
    await joinRoomByCode(guestPage, roomCode);
    await guestPage.getByRole("button", { name: "Toggle chat" }).click();
    await expect(guestPage.getByText("said before you arrived")).toBeVisible();

    // And new messages arrive live.
    await guestPage.getByPlaceholder("Type a message...").fill("hello host");
    await guestPage.getByRole("button", { name: "Send" }).click();
    await expect(hostPage.getByText("hello host")).toBeVisible();
  } finally {
    await leaveRoom(guestPage);
    await leaveRoom(hostPage);
    await hostContext.close();
    await guestContext.close();
  }
});

test("lobby chat reaches everyone in the lobby", async ({ browser }) => {
  const aContext = await browser.newContext();
  const bContext = await browser.newContext();
  const a = await aContext.newPage();
  const b = await bContext.newPage();

  try {
    await enterHerd(a, uniqueName("Ann"));
    await enterHerd(b, uniqueName("Ben"));
    const text = `lobby hello ${Date.now()}`;
    await sendChat(a, text);
    await b.getByRole("button", { name: "Toggle chat" }).click();
    await expect(b.getByText(text)).toBeVisible();
  } finally {
    await aContext.close();
    await bContext.close();
  }
});
