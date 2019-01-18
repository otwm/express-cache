const express = require('express')
const { getCacheMiddleware } = require('./lib/express-cache/src/index.js')
const server = express()

server.use(getCacheMiddleware())

server.get('/', (_, res) => {
  res.send('test')
})


server.listen(8080, () => {

})

