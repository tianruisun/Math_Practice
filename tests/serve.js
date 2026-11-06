/* Tiny static file server for local test runs (no dependencies).
   Accepts the root folder in any form ('D:/x', 'D:\x', relative): it is normalised with path.resolve, because a
   root that does not match Windows' own spelling made every request a 404, and a check waiting for the page then hung. */
const http = require('http'), fs = require('fs'), path = require('path');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

function fileFor(root, urlPath) {
  const base = path.resolve(root);
  const rel = decodeURIComponent(String(urlPath).split('?')[0]).replace(/\\/g, '/');
  let file = path.resolve(base, '.' + path.posix.normalize('/' + rel));
  if (file !== base && !file.startsWith(base + path.sep)) return null;   // outside the root
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  return fs.existsSync(file) ? file : null;
}

function serve(root) {
  const base = path.resolve(root);
  // Fail at once on a wrong folder, instead of serving 404s that a test may wait on forever.
  if (!fileFor(base, '/')) return Promise.reject(new Error(`serve: no index.html in ${base}`));
  const server = http.createServer((req, res) => {
    const file = fileFor(base, req.url);
    if (!file) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
  server.keepAliveTimeout = 1000;   // so server.close() is not held open by idle browser connections
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

module.exports = { serve, fileFor, TYPES };
