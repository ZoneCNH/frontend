// WebSocket relay: polls binance-server, pushes to WS clients
const { WebSocketServer } = require('ws')

const API = 'http://127.0.0.1:8081'
const PORT = parseInt(process.env.WS_PORT || '8095')
const POLL_MS = parseInt(process.env.WS_POLL_MS || '3000')
const MARKET_POLL_MS = parseInt(process.env.WS_MARKET_POLL_MS || '5000')

// Default symbols to stream price updates for
const SYMBOLS = ['spot:BTCUSDT', 'spot:ETHUSDT', 'um_perp:BTCUSDT']

const wss = new WebSocketServer({ port: PORT })
console.log('WS relay :' + PORT + ' -> ' + API + ' metrics:' + POLL_MS + 'ms market:' + MARKET_POLL_MS + 'ms')

let clients = 0
wss.on('connection', function(ws) {
  clients++; console.log('WS +1 (' + clients + ')')
  ws.on('close', function() { clients--; console.log('WS -1 (' + clients + ')') })
})

async function pollMetrics() {
  if (clients === 0) return
  try {
    var metrics = null
    try { metrics = await (await fetch(API + '/metrics')).text() } catch(e) {}
    var msg = JSON.stringify({ type: 'metrics', ts: new Date().toISOString(), metrics: metrics })
    wss.clients.forEach(function(c) { if (c.readyState === 1) c.send(msg) })
  } catch(e) { /* retry */ }
}

async function pollMarket() {
  if (clients === 0) return
  try {
    var ticks = {}
    for (var s of SYMBOLS) {
      var parts = s.split(':')
      try {
        var res = await fetch(API + '/api/v1/market/' + parts[0] + '/' + parts[1] + '/ticks/range?start=' +
          new Date(Date.now() - 60000).toISOString() + '&end=' + new Date().toISOString())
        if (res.ok) {
          var data = await res.json()
          if (data.length > 0) ticks[s] = data[data.length - 1]
        }
      } catch(e) {}
    }
    if (Object.keys(ticks).length > 0) {
      wss.clients.forEach(function(c) {
        if (c.readyState === 1) c.send(JSON.stringify({ type: 'market', ts: new Date().toISOString(), ticks: ticks }))
      })
    }
  } catch(e) { /* retry */ }
}

setInterval(pollMetrics, POLL_MS)
setInterval(pollMarket, MARKET_POLL_MS)
