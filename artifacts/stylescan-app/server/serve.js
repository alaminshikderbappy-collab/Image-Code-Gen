const http = require("http");
const fs = require("fs");
const path = require("path");

// This points directly to the web build
const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === "/") urlPath = "/index.html";
  
  let filePath = path.join(STATIC_ROOT, urlPath);

  // SPA Routing: If the file doesn't exist (like /scan or /matches), serve index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(STATIC_ROOT, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Build files not found. Please run the GitHub Action.");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log(`WEB APP IS LIVE ON PORT ${port}`);
});
