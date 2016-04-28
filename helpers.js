'use strict';

exports.type = function (actual, expected, key, parentNode) {
  if (expected === 'any') return true;
  if ('function' === typeof expected) {
    return expected.apply(this, arguments);
  }
  return expected === Object.prototype.toString.call(actual).match(/^\[object\s(.*)\]$/)[1].toLowerCase();
};

/*
 * Number
 */
exports.gt = function (actual, expected, key, parentNode) {
  return actual > expected;
};

exports.gte = function (actual, expected, key, parentNode) {
  return actual >= expected;
};

exports.lt = function (actual, expected, key, parentNode) {
  return actual < expected;
};

exports.lte = function (actual, expected, key, parentNode) {
  return actual <= expected;
};

exports.range = function (actual, expected, key, parentNode) {
  return (actual >= expected[0]) && (actual <= expected[1]);
};

/*
 * Array
 */
exports.enum = function (actual, expected, key, parentNode) {
  return expected.indexOf(actual) !== -1;
};

/*
 * RegExp
 */
exports.pattern = function (actual, expected, key, parentNode) {
  return expected.test(actual);
};

/*
 *Function
 */
exports.validate = function (actual, expected, key, parentNode) {
  return expected(actual, key, parentNode);
};

/*
 * other
 */
exports.required = function (actual, expected, key, parentNode) {
  return expected ? !!actual : true;
};