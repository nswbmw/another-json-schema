const assert = require('assert')

exports.deepEqual = function deepEqual (actual, expected, message) {
  if (actual && actual.error) {
    const errorObj = {}
    const keys = Object.keys(actual.error)
    for (const key of keys) {
      errorObj[key] = actual.error[key]
    }
    actual.error = errorObj
    assert.deepEqual(actual, expected, message)
  } else {
    assert.deepEqual(actual, expected, message)
  }
}
