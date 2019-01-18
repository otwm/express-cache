import {getCacheMiddleware} from "../cache";
import * as express from 'express'
import * as request from 'supertest'

const initServer = (routeFunc, middleware) => {
  const app = express()
  if (middleware) app.use(middleware)
  if (routeFunc) routeFunc(app)
  return app
}

let counter = 0
const rootRoute = (app) => {
  app.get('/', (_, res) => {
    counter++
    if (counter > 1) {
      res.json({ok: false})
      return false
    }
    res.json({ok: true})
  })
}

const initCounter = () => counter = 0

const success = () => expect(1).toBe(1)

test('some test', () => {
  success()
})

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

  test('hook injection', () => {

  })

  test('Config LRU', () => {

  })

  test('config cachePolicy', () => {

  })

  test('inject LRU', () => {

  })
})
