// Netlify build: the site at the root (sheeple-game.com) plus a copy built
// for the /sheeple base path in out/sheeple, which thorsteingames.com/sheeple
// proxies to (see lib/basePath.ts). Both are static exports.
import { execSync } from "node:child_process";
import { renameSync, rmSync } from "node:fs";

const build = (basePath) =>
  execSync("pnpm exec next build", {
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_BASE_PATH: basePath },
  });

rmSync("out-sheeple", { recursive: true, force: true });
build("/sheeple");
renameSync("out", "out-sheeple");
build("");
renameSync("out-sheeple", "out/sheeple");
// Netlify only reads _redirects from the publish root (it has /sheeple rules).
rmSync("out/sheeple/_redirects", { force: true });
