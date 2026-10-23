// A tiny local file saver for the asset export page (export.html): the page POSTs a PNG to /save?path=folder/name.png and it is written under the folder given as argument.
// Run:  node scripts/export-server.mjs "C:\path\to\output-folder"     (only listens on this computer)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(process.argv[2] ?? "export-output");
fs.mkdirSync(OUT, { recursive: true });
const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" };

http.createServer((req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const url = new URL(req.url, "http://localhost");
  if (req.method !== "POST" || url.pathname !== "/save") { res.writeHead(404, cors); return res.end(); }
  const rel = (url.searchParams.get("path") ?? "").replace(/\\/g, "/");
  const file = path.resolve(OUT, rel);
  if (!rel || !/^[A-Za-z0-9_\-./]+$/.test(rel) || !file.startsWith(OUT + path.sep)) { res.writeHead(400, cors); return res.end("bad path"); }
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.concat(chunks));
    res.writeHead(200, cors);
    res.end("ok");
  });
}).listen(8799, "127.0.0.1", () => console.log("saving to", OUT, "on http://127.0.0.1:8799/save"));
