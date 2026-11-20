# Hiretivo website

From the repository root, install dependencies with `yarn install`, then run `npm --prefix website run build`. The build uses the shared homepage and Tailwind styles. It requires no database, app credentials, or Next.js server.

The static files are in `website/.vercel/output/static`. To preview them locally, run `python3 -m http.server 4173 --directory website/.vercel/output/static` and open `http://localhost:4173`.

To deploy a preview, link `website/` to the separate `hiretivo-website` Vercel project, then run `vercel deploy --cwd website --prebuilt --environment preview`. The Vercel output includes a custom HTTP 404 for missing routes.
