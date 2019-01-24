import {is, isNil, path} from 'ramda'
import * as LRU from 'lru-cache'
import log from './log'
import express from 'express'

/**
 * 시간
 */
enum Time {
  sec = 1000, minute = 60000, hour = 3600000, halfDay = 43200000, day = 86400000,
}

/**
 * LRU 기본 설정
 */
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

/**
 * request 체크
 */
interface checkByRequestFunc {
  (req: express.Request): boolean,
}

/**
 * 정책 리스트
 */
interface PolicyList {
  id?: string,
  check: checkByRequestFunc
}

/**
 * 정책 리스트
 */
interface CachePolicy {
  routeList?: Array<PolicyList>,
  exceptList?: Array<PolicyList>,
}

/**
 * 훅 펑션
 */
interface hookFunc {
  (req: express.Request, res: express.Response, next: express.NextFunction, cached: CacheInfo): void
}

type keyType = string | symbol

interface CacheInfo {
  headersSent?: boolean,
  headers?: object,
  statusCode?: number,
  body: any,
}

interface generateKeyFunc {
  (req: express.Request): keyType,
}

const generateKey: generateKeyFunc = function (req: express.Request) {
  return `${req.url}-${req.method}`
}

interface resFunc {
  (res: express.Response, cacheInfo: CacheInfo): void
}

interface ConfigCache {
  configLRU?: LRU.Options,
  cachePolicy?: CachePolicy,
  LRU?: LRU.Cache<keyType, any>,
  hook?: hookFunc,
  generateKey?: generateKeyFunc,
  resFunc?: resFunc,
}

const resFunc: resFunc = (res: express.Response, cached) => {
  log('res cached')
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
}

let instance: LRU.Cache<any, any>;
const getLRU: (option?: LRU.Options) => LRU.Cache<any, any> = options => {
  if (isNil(instance)) {
    instance = new LRU(options)
  }
  return instance
}

function getCacheMiddleware(configCache: ConfigCache = defaultConfigCache) {
  const lruOptions = Object.assign({}, defaultLRUConfig, configCache.configLRU)
  const cache: LRU.Cache<keyType, any> = configCache.LRU || getLRU(lruOptions)

  function CacheMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    const getUseCache = (req: express.Request) => {
      const exists = (list: Array<PolicyList>) => {
        if (isNil(list)) return false
        return !!list.find(({check}: PolicyList) => check(req))
      }

      const exceptList = path<Array<PolicyList>>(['cachePolicy', 'exceptList'], configCache) || []
      const routeList = path<Array<PolicyList>>(['cachePolicy', 'routeList'], configCache) || []

      if (isNil(exceptList) && isNil(routeList)) return true
      if (exists(exceptList)) return false
      if (isNil(routeList)) return true
      return exists(routeList)
    }

    const useCache = getUseCache(req)
    log(`useCache: ${useCache}`)

    if (!useCache) {
      next();
      return;
    }

    const cached: CacheInfo = Object.assign({
        status: 200,
      }, cache.get(generateKey(req))
    )

    if (!cached.body) {
      const send = res.send.bind(res)
      res.send = function (body) {
        log('requested !!!')
        send(body)

        if (typeof body !== 'string') {
          return res;
        }

        const {statusCode, headersSent} = res
        const headers = res.getHeaders()
        setCache({req, key: generateKey(req)}, {body, statusCode, headersSent, headers})
        return res
      }

      next();
    } else {
      if (configCache.hook) configCache.hook(req, res, next, cached)

      const resFunction = configCache.resFunc || resFunc
      resFunction(res, cached)
    }
  }

  return CacheMiddleware
}

interface keyOrReq {
  key?: keyType,
  req?: express.Request,
}

/**
 * 캐쉬 설정
 * @param key
 * @param req
 * @param cacheInfo
 * @param maxAge
 */
function setCache({key, req}: keyOrReq, cacheInfo: CacheInfo, maxAge?: number) {
  const cache = getLRU()
  const getKey = ({key, req}: keyOrReq) => {
    if (!isNil(key)) return key
    if (!isNil(req)) return generateKey(req)
    throw new Error('need key or request!')
  }
  cache.set(getKey({key, req}), cacheInfo, maxAge)
}

export {
  getCacheMiddleware,
  setCache,
  Time,
  defaultLRUConfig,
  generateKey,
  resFunc,
}
