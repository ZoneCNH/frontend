// WebSocket relay: polls binance-server, pushes to WS clients
const { WebSocketServer } = require('ws')

const API = 'http://127.0.0.1:8081'
const PORT = parseInt(process.env.WS_PORT || '8095')
const POLL_MS = parseInt(process.env.WS_POLL_MS || '3000')

const wss = new WebSocketServer({ port: PORT })
console.log('WS relay :' + PORT + ' -> ' + API + ' every ' + POLL_MS + 'ms')

let clients = 0
wss.on('connection', function(ws) {
  clients++; console.log('WS +1 (' + clients + ')')
  ws.on('close', function() { clients--; console.log('WS -1 (' + clients + ')') })
})

async function poll() {
  if (clients === 0) return
  try {
    var metrics = null
    try { metrics = await (await fetch(API + '/metrics')).text() } catch(e) {}
    var msg = JSON.stringify({ type: 'update', ts: new Date().toISOString(), metrics: metrics })
    wss.clients.forEach(function(c) { if (c.readyState === 1) c.send(msg) })
  } catch(e) { /* retry */ }
}

setInterval(poll, POLL_MS)
