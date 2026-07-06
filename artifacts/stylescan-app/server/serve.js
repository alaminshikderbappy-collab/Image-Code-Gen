const http = require("http");
const fs = require("fs");
const path = require("path");

// This points to the web build folder
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
  // 1. Basic security: prevent directory traversal
  let urlPath = req.url.split('?')[0];
  if (urlPath === "/") urlPath = "/index.html";
  
  let filePath = path.join(STATIC_ROOT, urlPath);

  // 2. Handle Single Page Application (SPA) routing
  // If the file doesn't exist, serve index.html (this is why you saw 404s before)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(STATIC_ROOT, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end("Server Error: Build files missing. Please run GitHub Action.");
    } else {
      res.writeHead(200, { 
        "Content-Type": contentType,
        "Cache-Control": "no-cache" // Ensure users always get the latest version
      });
      res.end(content);
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log(`StyleScan WEB APP is now live on port ${port}`);
});
