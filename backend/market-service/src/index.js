const http = require('http');

const port = Number(process.env.PORT) || 4002;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ service: 'market-service', status: 'ok' }));
});

server.listen(port, () => {
  console.log(`market-service running on port ${port}`);
});
