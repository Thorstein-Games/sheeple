// Netlify build: the site is served at thorsteingames.com/sheeple, which
// proxies to this Netlify site's /sheeple path, so build once for the
// /sheeple base path into out/sheeple (see lib/basePath.ts). The publish
// root keeps only _redirects (which also sends sheeple-game.com to
// thorsteingames.com/sheeple) and a 404 page.
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync, renameSync, rmSync } from "node:fs";

rmSync("out", { recursive: true, force: true });
rmSync("out-sheeple", { recursive: true, force: true });
execSync("pnpm exec next build", {
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_BASE_PATH: "/sheeple" },
});
renameSync("out", "out-sheeple");
mkdirSync("out");
renameSync("out-sheeple", "out/sheeple");
// Netlify only reads _redirects and 404.html from the publish root.
renameSync("out/sheeple/_redirects", "out/_redirects");
copyFileSync("out/sheeple/404.html", "out/404.html");
