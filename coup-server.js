const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

const rooms = {};

wss.on('connection', ws => {
  ws.on('message', msg => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }
    if (data.type === 'join') {
      ws.room = data.room;
      ws.nick = data.nick;
      if (!rooms[ws.room]) rooms[ws.room] = [];
      if (!rooms[ws.room].find(p => p.nick === ws.nick)) {
        rooms[ws.room].push({ ws, nick: ws.nick });
      }
      broadcast(ws.room, {
        type: 'joined',
        players: rooms[ws.room].map(p => p.nick),
        host: rooms[ws.room][0].nick
      });
    }
    if (data.type === 'start') {
      broadcast(ws.room, { type: 'start' });
    }
  });
  ws.on('close', () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room] = rooms[ws.room].filter(p => p.ws !== ws);
      if (rooms[ws.room].length === 0) delete rooms[ws.room];
      else broadcast(ws.room, {
        type: 'update',
        players: rooms[ws.room].map(p => p.nick),
        host: rooms[ws.room][0].nick
      });
    }
  });
});

function broadcast(room, msg) {
  if (!rooms[room]) return;
  rooms[room].forEach(p => {
    try { p.ws.send(JSON.stringify(msg)); } catch {}
  });
}
