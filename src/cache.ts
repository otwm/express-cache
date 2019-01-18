import {is} from 'ramda'

enum Time {
  sec = 1000, minute = 60000, hour = 3600000, halfDay = 43200000, day = 86400000,
}

const defaultLRUConfig = {
  max: 1000,
  maxAge: 5 * Time.minute,
  length: function (value = '') {
    const stringLength = value => value.length / 10
    const NumberLength = value => value.toString().length

    const strOrNumberLength = (value) => {
      if (is(value, String)) {
        return stringLength(value)
      }
      if (is(value, Number)) {
        return NumberLength(value)
      }
      return 1 // other
    }
    if (is(value, Object)) {
      Object.values(value).map(strOrNumberLength).reduce((result, current) => {
        return result + current
      }, 0)
    }
    return strOrNumberLength(value)
  },
}

function getCacheMiddleware() {

}

function setCache() {

}

export {
  getCacheMiddleware,
  setCache,
  Time,
  defaultLRUConfig,
}
