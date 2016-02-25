'use strict';

var AJS = require('..');
var assert = require('assert');

describe('helper', function () {
  it('error', function () {
    try {
      AJS.register('gt');
    } catch(e) {
      assert.equal(e.message, 'Missing name or fn');
    }
  });

  it('.gt18', function () {
    AJS.register('gt18', function (actual, expected) {
      return expected ? (actual > 18) : (actual <= 18);
    });
    var schema = AJS('adultSchema', { type: 'number', gt18: true });
    assert.deepEqual(schema, {
      _leaf: true,
      _name: 'adultSchema',
      _children: { type: 'number', gt18: true },
      _parent: null,
      _path: '$',
      _schema: { type: 'number', gt18: true }
    });
    assert.deepEqual(schema.validate(19), { valid: true, error: null, result: 19 });
    assert.deepEqual(schema.validate(0), { valid: false,
      error: 
       {
         schema: 'adultSchema',
         validator: 'gt18',
         actual: 0,
         expected: { type: 'number', gt18: true },
         path: '$' },
      result: 0
    });
  });

  it('.type', function () {
    var schema = AJS('typeSchema', { type: 'any' });
    assert.deepEqual(schema.validate(0), { valid: true, error: null, result: 0 });
    assert.deepEqual(schema.validate('0'), { valid: true, error: null, result: '0' });
    assert.deepEqual(schema.validate(true), { valid: true, error: null, result: true });

    var schema = AJS('typeSchema', { type: 'number' });
    assert.deepEqual(schema.validate(0), { valid: true, error: null, result: 0 });
    assert.deepEqual(schema.validate('0'), { valid: false,
      error: 
       {
         validator: 'type',
         actual: '0',
         expected: { type: 'number' },
         path: '$',
         schema: 'typeSchema' },
      result: '0'
    });

    var checkIsObject = function (actual) {
      return typeof actual === 'object';
    };
    var schema = AJS('typeSchema', { type: checkIsObject });

    assert.deepEqual(schema.validate([]), { valid: true, error: null, result: [] });
    assert.deepEqual(schema.validate({}), { valid: true, error: null, result: {} });
    assert.deepEqual(schema.validate(0), { valid: false,
      error: 
       {
         validator: 'type',
         actual: 0,
         expected: { type: checkIsObject },
         path: '$',
         schema: 'typeSchema' },
      result: 0
    });
  });

  it('.gt', function () {
    var schema = AJS('numberSchema', { type: 'number', gt: 0 });
    assert.deepEqual(schema.validate(1), { valid: true, error: null, result: 1 });
    assert.deepEqual(schema.validate(0), { valid: false,
      error: 
       {
         schema: 'numberSchema',
         validator: 'gt',
         actual: 0,
         expected: { type: 'number', gt: 0 },
         path: '$' },
      result: 0
    });
  });

  it('.gte', function () {
    var schema = AJS('numberSchema', { type: 'number', gte: 0 });
    assert.deepEqual(schema.validate(1), { valid: true, error: null, result: 1 });
    assert.deepEqual(schema.validate(-1), { valid: false,
      error: 
       {
         schema: 'numberSchema',
         validator: 'gte',
         actual: -1,
         expected: { type: 'number', gte: 0 },
         path: '$' },
      result: -1
    });
  });

  it('.lt', function () {
    var schema = AJS('numberSchema', { type: 'number', lt: 0 });
    assert.deepEqual(schema.validate(-1), { valid: true, error: null, result: -1 });
    assert.deepEqual(schema.validate(0), { valid: false,
      error: 
       {
         schema: 'numberSchema',
         validator: 'lt',
         actual: 0,
         expected: { type: 'number', lt: 0 },
         path: '$' },
      result: 0
    });
  });

  it('.lte', function () {
    var schema = AJS('numberSchema', { type: 'number', lte: 0 });
    assert.deepEqual(schema.validate(0), { valid: true, error: null, result: 0 });
    assert.deepEqual(schema.validate(1), { valid: false,
      error: 
       {
         schema: 'numberSchema',
         validator: 'lte',
         actual: 1,
         expected: { type: 'number', lte: 0 },
         path: '$' },
      result: 1
    });
  });

  it('.range', function () {
    var schema = AJS('numberSchema', { type: 'number', range: [0, 10] });
    assert.deepEqual(schema.validate(0), { valid: true, error: null, result: 0 });
    assert.deepEqual(schema.validate(10), { valid: true, error: null, result: 10 });
    assert.deepEqual(schema.validate(-1), { valid: false,
      error: 
       {
         schema: 'numberSchema',
         validator: 'range',
         actual: -1,
         expected: { type: 'number', range: [0, 10] },
         path: '$' },
      result: -1
    });
  });

  it('.enum', function () {
    var schema = AJS('enumSchema', { type: 'string', enum: ['aaa', 'bbb'] });
    assert.deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' });
    assert.deepEqual(schema.validate('ccc'), { valid: false,
      error: 
       {
         validator: 'enum',
         actual: 'ccc',
         expected: { type: 'string', enum: ['aaa', 'bbb'] },
         path: '$',
         schema: 'enumSchema' },
      result: 'ccc'
    });
  });

  it('.required', function () {
    var schema = AJS('requiredSchema', { type: 'string', required: true });
    assert.deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' });
    assert.deepEqual(schema.validate(''), { valid: false,
      error: 
       {
         validator: 'required',
         actual: '',
         expected: { type: 'string', required: true },
         path: '$',
         schema: 'requiredSchema' },
      result: ''
    });

    var schema = AJS('requiredSchema', { type: 'string', required: 0 });
    assert.deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' });
    assert.deepEqual(schema.validate(''), { valid: true, error: null, result: '' });
  });

  it('.pattern', function () {
    var schema = AJS('patternSchema', { type: 'string', pattern: /^a/ });
    assert.deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' });
    assert.deepEqual(schema.validate('bbb'), { valid: false,
      error: 
       {
         validator: 'pattern',
         actual: 'bbb',
         expected: { type: 'string', pattern: /^a/ },
         path: '$',
         schema: 'patternSchema' },
      result: 'bbb'
    });
  });

  it('.validate', function () {
    var validate = function (actual) {
      return actual === 'aaa';
    };
    var schema = AJS('validateSchema', { type: 'string', validate: validate });
    assert.deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' });
    assert.deepEqual(schema.validate('bbb'), { valid: false,
      error: 
       {
         validator: 'validate',
         actual: 'bbb',
         expected: { type: 'string', validate: validate },
         path: '$',
         schema: 'validateSchema' },
      result: 'bbb'
    });
  });

  it('.validate false', function () {
    var validate = function (actual) {
      return actual === 'aaa';
    };
    var schema = AJS('validateSchema', { type: 'string', validate: validate });
    assert.deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' });
    assert.deepEqual(schema.validate('bbb', { validate: false }), { valid: true, error: null, result: 'bbb' });
  });
});
