import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Route API requests to api/orders.js
  if (pathname === '/api/orders' || pathname.startsWith('/api/orders/')) {
    try {
      const { default: handler } = await import('./api/orders.js');

      // Helper for Vercel/Express-like req & res
      req.query = Object.fromEntries(parsedUrl.searchParams.entries());

      // Parse JSON body if available
      if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const rawBody = Buffer.concat(buffers).toString('utf8');
        try {
          req.body = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          req.body = rawBody;
        }
      } else {
        req.body = {};
      }

      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
      };

      await handler(req, res);
      return;
    } catch (err) {
      console.error('API Error:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // If URL doesn't have extension and file exists as .html (cleanUrls support)
  if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`
☕ ================================================
   KANTIN BOASH DEV SERVER READY!
   Port: http://localhost:${PORT}
   ------------------------------------------------
   • Beranda:         http://localhost:${PORT}/index.html
   • Katalog Menu:    http://localhost:${PORT}/menu.html
   • Lacak Status:    http://localhost:${PORT}/status.html
   • Portal Penjual:  http://localhost:${PORT}/penjual.html
   • Live Orders API: http://localhost:${PORT}/api/orders
================================================
`);
});
