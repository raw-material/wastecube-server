const WebSocket = require('ws')
const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const pino = require('pino')({
  prettyPrint: { colorize: true }
})
const expressPino = require('express-pino-logger')({ logger: pino })

const data = require('./public/data.json')

/*
 * Socket to read sensors' signals
 */

const wss = new WebSocket.Server({
  port: 5001
})

wss.on('connection', function connection(socket) {
  let count = 0
  pino.info('ws: socket connected')

  socket.on('open', function open() {
    socket.send(count)
    pino.info('ws: socket opened')
  })

  socket.on('message', function message(msg) {
    if (msg === 'reset') {
      count = 0
      socket.send(count)
      pino.info('ws: socket requested reset')
    }
  })

  let interval = setInterval(function updateCount() {
    socket.send(++count)
    pino.info(`ws: got sensors signal, count: ${count}`)
  }, 2000)

  socket.on('close', function close() {
    count = 0
    pino.info('ws: socket closed')
    clearInterval(interval)
  })
})

/*
 * Database RESTful server
 */

const app = express()

app.use(expressPino)
app.use(cors())

app.get('/', (req, res) => {
  pino.info('restapi: hellooo')
  res.status(200).send('Document this')
})

app.get('/data', (req, res) => {
  pino.info('restapi: get data')
  res.status(200).send(data)
})

app.use('/static', express.static(path.join(__dirname, 'public')))

app.listen(5000, () => pino.info('Listening on port 5000'))
