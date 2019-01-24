import * as LRU from 'lru-cache'
import {getCacheMiddleware} from "../cache";
import * as express from 'express'
import * as request from 'supertest'

const initServer = (routeFunc: (app: express.Application) => void, middleware: any) => {
  const app = express()
  if (middleware) app.use(middleware)
  if (routeFunc) routeFunc(app)
  return app
}

let counter = 0
const rootRoute = (app: any) => {
  app.get('/', (_: any, res: any) => {
    counter++
    if (counter > 1) {
      res.json({ok: false})
      return false
    }
    res.json({ok: true})
  })
}

let callCountRoute1 = 0
let callCountRoute2 = 0
let callCountE1 = 0
let callCountE2 = 0

const policyRoute = (app: any) => {
  app.get('/route1', (_: any, res: any) => {
    callCountRoute1++
    res.json({ok: true})
  }).get('/route2', (_: any, res: any) => {
    callCountRoute2++
    res.json({ok: true})
  }).get('/e1', (_: any, res: any) => {
    callCountE1++
    res.json({ok: true})
  }).get('/e2', (_: any, res: any) => {
    callCountE2++
    res.json({ok: true})
  })
}

const variousRoute = (app: any) => {
  app.get('/json', (_: any, res: any) => {
    res.json({ok: true})
  }).get('/send', (_: any, res: any) => {
    res.send('test')
  }).get('/sendStatus', (_: any, res: any) => {
    res.sendStatus(200)
  }).get('/jsonp', (_: any, res: any) => {
    res.jsonp({ok: true})
  })
}

const initCounter = () => counter = 0

describe('getCacheMiddleware', () => {
  test('No cache', async () => {
    const app = initServer(rootRoute, null)
    const res = await request(app).get('/')
    expect(res.body).toEqual({ok: true})
    const res2 = await request(app).get('/')
    expect(res2.body).toEqual({ok: false})
    initCounter()
  })

  test('기본 사용법', async () => {
    const app = initServer(rootRoute, getCacheMiddleware())
    const res = await request(app).get('/')
    expect(res.body).toEqual({ok: true})
    const res2 = await request(app).get('/')
    expect(res2.body).toEqual({ok: true})
    initCounter()
  })

  test('hook injection', async () => {
    let isHookCalled = false
    const app = initServer(rootRoute, getCacheMiddleware({
      hook: (_rq, _rs, _n, _c) => {
        isHookCalled = true
      }
    }))
    const res = await request(app).get('/')
    expect(res.body).toEqual({ok: true})
    const res2 = await request(app).get('/')
    expect(res2.body).toEqual({ok: true})
    expect(isHookCalled).toBe(true)
    initCounter()
  })

  test('Config LRU', async () => {
    let isLengthCalled = false
    const app = initServer(rootRoute, getCacheMiddleware({
      configLRU: {
        max: 10,
        maxAge: 100000,
        length: (_value) => {
          isLengthCalled = true
          return 1
        }
      }
    }))
    const res = await request(app).get('/')
    expect(res.body).toEqual({ok: true})
    const res2 = await request(app).get('/')
    expect(res2.body).toEqual({ok: true})

    setTimeout(() => {
      expect(isLengthCalled).toBe(true)
    }, 100)

    initCounter()
  })

  test('config cachePolicy', async () => {
    const app = initServer(policyRoute, getCacheMiddleware({
      cachePolicy: {
        routeList: [{
          id: '/route1', //id is not require
          check: (req) => /route1/.test(req.url),
        }, {
          id: '/route2',
          check: (req) => {
            return /route2/.test(req.url)
          },
        }],
        exceptList: [{
          id: '/ex1',
          check: (req) => /ex1/.test(req.url),
        }, {
          id: '/ex2',
          check: (req) => /ex2/.test(req.url),
        }],
      }
    }))
    await request(app).get('/route1')
    await request(app).get('/route1')
    await request(app).get('/route1')

    expect(callCountRoute1).toBe(1)

    await request(app).get('/route2')
    await request(app).get('/route2')
    await request(app).get('/route2')

    expect(callCountRoute2).toBe(1)

    await request(app).get('/e1')
    await request(app).get('/e1')
    await request(app).get('/e1')

    expect(callCountE1).toBe(3)

    await request(app).get('/e2')
    await request(app).get('/e2')
    await request(app).get('/e2')

    expect(callCountE2).toBe(3)
  })

  test('inject LRU', async () => {
    let isLengthCalled = false
    const instance: LRU.Cache<string, any> = new LRU({
      max: 10,
      maxAge: 100000,
      length: (_value) => {
        isLengthCalled = true
        return 1
      }
    })
    const app = initServer(rootRoute, getCacheMiddleware({
      LRU: instance
    }))
    const res = await request(app).get('/')
    expect(res.body).toEqual({ok: true})
    const res2 = await request(app).get('/')
    expect(res2.body).toEqual({ok: false})

    setTimeout(() => {
      expect(isLengthCalled).toBe(true)
    }, 100)
  })

  test('various res', async () => {
    const app = initServer(variousRoute, getCacheMiddleware())
    const res = await request(app).get('/json')
    expect(res.body).toEqual({ok: true})
    const res4 = await request(app).get('/sendStatus')
    expect(res4.text).toEqual('OK')
    const res5 = await request(app).get('/jsonp')
    expect(res5.body).toEqual({ok: true})
    const res3 = await request(app).get('/send')
    expect(res3.text).toEqual('test')

    initCounter()
  })
})
