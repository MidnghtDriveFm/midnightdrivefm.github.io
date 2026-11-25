const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const { TikTokLiveConnection } = require('tiktok-live-connector');

const username = 'stifler_da_first';
const commands = new Set([
  'rain', 'clear', 'city', 'forest',
  'coast', 'night', 'sunset', 'day',
  'left', 'right'
]);

let connected = false;
let connecting = false;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify({
    server: 'Midnight Drive FM',
    tiktok: connected ? 'connected' : 'waiting'
  }));
});

const wss = new WebSocketServer({ server });
const tiktok = new TikTokLiveConnection(username, { processInitialData: false });

tiktok.on('chat', data => {
  const command = String(data.comment || '')
    .trim().toLowerCase();

  if (!commands.has(command)) return;

  console.log('Command:', command);

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        command: command
      }));
    }
  });
});

tiktok.on('disconnected', () => {
  connected = false;
  console.log('TikTok disconnected');
});

tiktok.on('error', err => {
console.log('TikTok error:', err?.message ?? err?.exception?.message ?? err?.info ?? 'Unknown error');
});

async function connectTikTok() {
  if (connected || connecting) return;
  connecting = true;

  try {
    await tiktok.connect();
    connected = true;
    console.log('TikTok LIVE connected');
  } catch (err) {
    connected = false;
    console.log('Waiting for LIVE:', err.message);
  } finally {
    connecting = false;
  }
}

server.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Midnight Drive server started');
  connectTikTok();
});

setInterval(connectTikTok, 30000);
