import { test, expect } from "@playwright/test";
import { leaveRoom, uniqueName } from "./fixtures";

test("host readies up with dev bots and starts a round", async ({ page }) => {
  // Runs last in the suite (numeric filename prefix controls order): bots
  // never leave a room once added, so this test permanently occupies a room
  // and must not run before the others that rely on quickplay-matching an
  // empty room.
  try {
    const hostName = uniqueName("Host");

    await page.goto("/");
    await page.getByPlaceholder("Your name").fill(hostName);
    await page.getByRole("button", { name: "Join Test Room (5 Bots)" }).click();

    await page.waitForURL(/\/room\/[A-Z0-9]+$/);
    await expect(page.getByText("Players in Room (6/12)")).toBeVisible();

    // Bots are pre-ready server-side; only the host needs to ready up.
    await page.getByRole("button", { name: "Ready", exact: true }).click();
    await expect(page.getByText("✓ You're Ready!")).toBeVisible();

    const startButton = page.getByRole("button", { name: "Start Game" });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Ready Room is replaced by the first round's prompt UI.
    await expect(page.getByText(/Round \d+ of \d+/)).toBeVisible();
    await expect(
      page.getByText("Think like the herd! What will most people say?"),
    ).toBeVisible();
  } finally {
    await leaveRoom(page).catch(() => {});
  }
});
