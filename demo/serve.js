#!/usr/bin/env node

/**
 * Simple HTTP server for Color Splash demo
 * Usage: node serve.js [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.argv[2] || 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // Enable CORS for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Serve index.html for root path
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Resolve file path
  let filePath = path.join(__dirname, pathname);

  // Handle requests to parent directory (for dist files)
  if (pathname.startsWith('/dist/')) {
    filePath = path.join(__dirname, '..', pathname);
  }

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found: ' + pathname);
      return;
    }

    serveFile(res, filePath);
  });
});

server.listen(PORT, () => {
  console.log(`🎨 Color Splash Demo Server running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n📁 Serving files from: ${__dirname}`);
  console.log(`📊 Sample image available: sample-image.png`);
  console.log(`\nPress Ctrl+C to stop the server`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try a different port:`);
    console.error(`   node serve.js 8081`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});