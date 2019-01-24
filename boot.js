const express = require('express')
const { getCacheMiddleware } = require('./lib/express-cache/src/index.js')
const server = express()

let isLengthCalled = false

server.use(getCacheMiddleware({
  cachePolicy: {
    routeList: [{
      check: req => /test/.test(req.url)
    }],
    exceptList: [{
      check: req => /ep/.test(req.url)
    }],
  },
  hook: () => {
    console.log('isLengthCalled',isLengthCalled)
  },
  configLRU: {
    max: 10,
    maxAge: 100000,
    length: (_value) => {
      isLengthCalled = true
      return 1
    }
  }
}))

server.get('/', (_, res) => {
  console.log(isLengthCalled)
  res.send('test')
}).get('/test', (_ , res) => {
  console.log('=== test')
  res.send('test')
}).get('/ep', (_ , res) => {
  console.log('=== ep')
  res.send('e')
})


server.listen(8080, () => {

})

