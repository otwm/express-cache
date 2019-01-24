# express cache
익스프레스 용 캐쉬. 기본은 LRU 기반 캐쉬 

## how to use
### 기본 사용법
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
//...
function logging(req, res, next, cached) {
  debug(`req info: ${req.url} ${req.method}`)
  debug(`cache info: ${key} ${value}`)
}

app.use(getCacheMiddleware({ hook: logging}))
```

### Config LRU
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
//...
app.use(getCacheMiddleware({
  LRU: myLRU
}))
```

## change cache
next iteration

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
  length: function(value = '', key) {
    const stringLength = value => value.length / 10
    const NumberLength = value => value.toString().length
    
    const strOrNumberLength = (value) => {
      if (is(value,String)) {
        return stringLength(value)
      }
      if (is(value,Number)) {
        return NumberLength(value)
      }
      return 1 // other
    }
    if (is(value,Object)) {
      Object.values(value).map(strOrNumberLength).reduce((result, current) => {
        return result + current
      }, 0)
    }
    return strOrNumberLength(value)
  },
}
```
