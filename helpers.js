const validator = require('validator')
const toString = Object.prototype.toString

exports.type = function (actual, expected, key, parent) {
  if (expected === 'any') return true
  if (typeof expected === 'function') {
    return expected.call(this, actual, key, parent)
  }
  return expected === toString.call(actual).match(/^\[object\s(.*)\]$/)[1].toLowerCase()
}

/*
 * String
 */
exports.length = function (actual, expected, key, parent) {
  if (Array.isArray(expected)) {
    const len = actual.length
    return len >= expected[0] && len <= expected[1]
  }
  return actual.length === expected
}

// return true|false
/*
 * Number
 */
exports.gt = function (actual, expected, key, parent) {
  return actual > expected
}

exports.gte = function (actual, expected, key, parent) {
  return actual >= expected
}

exports.lt = function (actual, expected, key, parent) {
  return actual < expected
}

exports.lte = function (actual, expected, key, parent) {
  return actual <= expected
}

exports.range = function (actual, expected, key, parent) {
  return (actual >= expected[0]) && (actual <= expected[1])
}

/*
 * Array
 */
exports.enum = function (actual, expected, key, parent) {
  return expected.indexOf(actual) !== -1
}

/*
 * RegExp
 */
exports.pattern = function (actual, expected, key, parent) {
  return expected.test(actual)
}

exports.default = function (actual, expected, key, parent) {
  parent[key] = actual != null
    ? actual
    : (typeof expected === 'function' ? expected.apply(this, arguments) : expected)
  return true
}

exports.required = function (actual, expected, key, parent) {
  return actual != null
}

/*
 * common
 */

exports.eq = exports.equal = function (actual, expected, key, parent) {
  return actual === expected
}

/*
 * validator's `isXxx`
 */
Object.keys(validator)
  .filter(name => !!name.match(/^is/))
  .forEach(name => {
    exports[name] = function (actual, expected, key, parent) {
      if (typeof actual !== 'string') {
        return false
      }
      expected = Array.isArray(expected) ? expected : [expected]
      return validator[name](actual, ...expected.slice(0, -1)) === expected[expected.length - 1]
    }
  })
