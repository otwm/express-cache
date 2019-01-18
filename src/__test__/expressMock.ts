const req = {}
const res = {
  value: null,
  reset() {
    res.value = null
  },
  status(_) {
    res.reset()
    const fn = (value) => {
      res.value = value
      return value
    };
    return {
      json: fn,
      text: fn,
    }
  }
}

const next = () => {
}

export const app = {
  fn: null,
  middleware: null,
  use(middleware) {
    app.middleware = middleware
    middleware(req, res, next)
  },
  get(_, fn) {
    app.fn = fn
  },
}

export const request = (_) => {
  if (app.middleware) app.middleware(req, res, next)
  if (res.value) {
    return res.value
  }
  return app.fn()
}

