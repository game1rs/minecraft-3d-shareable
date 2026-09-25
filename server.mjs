import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = new URL(req.url, "http://localhost").pathname;
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = path.join(root, urlPath);
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        if (urlPath.startsWith("/src/") || urlPath.startsWith("/assets/")) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found: " + urlPath);
          return;
        }
        const idx = path.join(root, "index.html");
        fs.readFile(idx, (e, data) => {
          if (e) {
            res.writeHead(500);
            res.end("Missing index.html");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
          res.end(data);
        });
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const ct = mime[ext] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": ct,
        "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Access-Control-Allow-Origin": "*",
      });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    res.writeHead(500);
    res.end("Server error: " + e.message);
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;
server.listen(port, "0.0.0.0", () => {
  console.log(`BLOCKWILD server listening on http://0.0.0.0:${port}`);
});
