const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8088;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/v1/cafm/stats')) {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({
      status: "success",
      timestamp: new Date().toISOString(),
      data: {
        reactiveSlaPercent: 96.8,
        ppmCompletionPercent: 98.9,
        customerComplaintsLogged: 0,
        criticalAssetUptime: 99.98,
        hseLostTimeInjuries: 0
      }
    }));
    return;
  }

  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Berkley KPI Evaluation Portal running at http://localhost:${PORT}`);
});
