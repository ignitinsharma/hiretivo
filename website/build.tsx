/* eslint-disable @next/next/no-head-element, @next/next/no-css-tags, @next/next/no-html-link-for-pages -- The build renders a standalone HTML document. */

import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import tailwind from "@tailwindcss/postcss";
import postcss from "postcss";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FeaturesPage, featureScreenshots } from "../src/components/marketing/features-page";
import { HomePage } from "../src/components/marketing/home-page";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = join(here, "..");
const output = join(here, ".vercel/output");
const staticDir = join(output, "static");

function html(title: string, content: ReactNode, script?: string) {
  return "<!doctype html>" + renderToStaticMarkup(
    <html lang="en" className="h-full antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content="Hiretivo is a self-hosted workspace for your job search, tailored resumes, and applications." />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@variable&display=swap" />
        <link rel="stylesheet" href="/site.css" />
      </head>
      <body className="min-h-full">{content}{script && <script src={script} defer />}</body>
    </html>,
  );
}

const cssPath = join(root, "src/app/globals.css");
const styles = await readFile(cssPath, "utf8");
const sources = [
  "../components/marketing",
  "../components/brand-mark.tsx",
  "../components/ui/button.tsx",
  "../../website/build.tsx",
].map((source) => `@source "${source}";`).join("\n");
const { css } = await postcss([tailwind({ base: here, optimize: true })])
  .process(`${styles}\n${sources}`, { from: cssPath });

const navScript = "/marketing/nav.js";
const home = html("Hiretivo · Self-hosted job search workspace", <HomePage />, navScript);
const notFound = html("Page not found · Hiretivo", (
  <main data-hiretivo-home="" className="mx-auto max-w-[650px] px-6 py-16 text-center">
    <h1 className="text-4xl font-semibold text-primary-text">Page not found</h1>
    <a href="/" className="mt-6 inline-block underline">Back to Hiretivo</a>
  </main>
));

await rm(output, { recursive: true, force: true });
await Promise.all(["marketing", "features"].map((dir) => mkdir(join(staticDir, dir), { recursive: true })));
await Promise.all([
  build({
    stdin: {
      contents: 'import { connectHomeNavTheme } from "./src/components/marketing/home-nav-theme"; connectHomeNavTheme();',
      resolveDir: root,
    },
    bundle: true,
    minify: true,
    target: "es2020",
    outfile: join(staticDir, "marketing/nav.js"),
  }),
  writeFile(join(staticDir, "index.html"), home),
  writeFile(join(staticDir, "features/index.html"), html("How Hiretivo works · Features", <FeaturesPage />, navScript)),
  writeFile(join(staticDir, "404.html"), notFound),
  writeFile(join(staticDir, "site.css"), css),
  copyFile(join(root, "src/app/icon.svg"), join(staticDir, "icon.svg")),
  ...["dashboard.webp", ...featureScreenshots].map((file) =>
    copyFile(join(root, "public/marketing", file), join(staticDir, "marketing", file))
  ),
  writeFile(join(output, "config.json"), JSON.stringify({
    version: 3,
    routes: [
      { src: "^/$", dest: "/index.html" },
      { src: "^/features/?$", dest: "/features/index.html" },
      { handle: "filesystem" },
      { src: "/.*", dest: "/404.html", status: 404 },
    ],
  }, null, 2) + "\n"),
]);
