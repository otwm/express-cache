# express cache
Cache Middleware for Express. The default is LRU-based cache 
    
    
[![Build Status](https://travis-ci.com/otwm/express-cache.svg?branch=master)](https://travis-ci.com/otwm/express-cache)
[![Coverage Status](https://coveralls.io/repos/github/otwm/express-cache/badge.svg?branch=master)](https://coveralls.io/github/otwm/express-cache?branch=master)

## how to use
### basic
```ecmascript 6
// server.js
import { getCacheMiddleware } from 'express-cache'
//...
app.use(getCacheMiddleware()) 
```

### hook injection
```ecmascript 6
// server.js
import { getCacheMiddleware } from 'express-cache'

// logging during cache operation
function logging(req, res, next, cached) {
  debug(`req info: ${req.url} ${req.method}`)
  debug(`cache info: ${key} ${value}`)
}

app.use(getCacheMiddleware({ hook: logging}))
```

### Config LRU
ref. https://github.com/isaacs/node-lru-cache
```ecmascript 6
// server.js
import { getCacheMiddleware } from 'express-cache'
//...
app.use(getCacheMiddleware({
  configLRU : {
    max: 1,
    maxAge: 100,
    length: function(value, key) {
      //...
    }
  }
}))
//

```
## config cachePolicy
routeList 존재하면, 정확히 routeList 명시된 것에만 적용, 없으면 전체 적용
exceptList 존재하면, exceptList 제외

routeList If present, applies exactly to the routeList specified;
exceptList Except, exceptList Except

```ecmascript 6
// server.js
import { getCacheMiddleware, strategy } from 'express-cache'
//...
app.use(getCacheMiddleware({
  cachePolicy: {
    routeList: [ {
      id: 'someUrl',
      check: (req) => {
        return true // or false
      }, 
    }],
    exceptList: [{
      id: 'someUrl',
      check: (req) => {
        return true // or false
      }, 
    }],
  }
}))
```

## inject LRU
cluster 등 LRU 공유 필요 시 외부에서 주입
```ecmascript 6
// server.js
import { getCacheMiddleware } from 'express-cache'

//cluster, etc. If LRU sharing is required,
app.use(getCacheMiddleware({
  LRU: myLRU
}))
```

## export LRU Cache
```ecmascript 6
import { getLRU } from 'express-cache'

getLRU().resert()
```

## default value
```typescript
const sec = 1000
const minute = 1000 * 60
const hour = minute * 60
const halfDay = hour * 12
const day = hour * 24   

enum Time {
  sec, minute, hour, halfDay, day,
}

const defaultLRUConfig = {
  max: 1000,
  maxAge: 5 * Time.minute,
  // @ts-ignore
  length: function (value = '') {
    // @ts-ignore
    const stringLength = value => value.length / 10
    // @ts-ignore
    const NumberLength = value => value.toString().length

    const strOrNumberLength = (value: string | number) => {
      if (is(String, value)) {
        return stringLength(value)
      }
      if (is(Number, value)) {
        return NumberLength(value)
      }
      return 1 // other
    }
    if (is(Object, value)) {
      Object.values(value).map(strOrNumberLength).reduce((result, current) => {
        return result + current
      }, 0)
    }
    return strOrNumberLength(value)
  },
}

const generateKey: generateKeyFunc = function (req: express.Request) {
  return `${req.originalUrl}-${req.method}`
}

const isErrorFunc: isError = (_, res) => {
  return res.statusCode > 400
}

const resFunc: resFunc = (res: express.Response, cached) => {
  const reqUrl = path<string>(['req', 'url'], res)
  log(`cached send reqUrl : ${reqUrl}`)
  const {body, statusCode = 200, headersSent, headers} = cached
  if (headersSent && headers) {
    res.set(headers)
  }
  res.status(statusCode).send(body)
}

const defaultConfigCache = {
  configLRU: defaultLRUConfig,
  generateKey,
  resFunc,
  isError: isErrorFunc,
}


```

## ref
https://github.com/isaacs/node-lru-cache
