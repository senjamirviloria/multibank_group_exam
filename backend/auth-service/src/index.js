const http = require('http');

const port = Number(process.env.PORT) || 4001;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ service: 'auth-service', status: 'ok' }));
});

server.listen(port, () => {
  console.log(`auth-service running on port ${port}`);
});
