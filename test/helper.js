const AJS = require('..')
const assert = require('assert')
const validator = require('validator')
const toObjectId = require('mongodb').ObjectId

describe('helper', function () {
  it('error', function () {
    try {
      AJS.register('gt')
    } catch (e) {
      assert.equal(e.message, 'Missing name or fn')
    }
  })

  it('.gt18', function () {
    AJS.register('gt18', function (actual, expected) {
      return expected ? (actual > 18) : (actual <= 18)
    })
    const schema = AJS('adultSchema', { type: 'number', gt18: true })
    assert.deepEqual(schema, {
      _leaf: true,
      _name: 'adultSchema',
      _children: { type: 'number', gt18: true },
      _parent: null,
      _path: '$',
      _schema: { type: 'number', gt18: true }
    })
    assert.deepEqual(schema.validate(19), { valid: true, error: null, result: 19 })
    assert.deepEqual(schema.validate(0), { valid: false,
      error:
       {
         schema: 'adultSchema',
         validator: 'gt18',
         actual: 0,
         expected: { type: 'number', gt18: true },
         path: '$' },
      result: 0
    })

    // gt18: false
    assert.deepEqual(schema.validate(0, { gt18: false }), { valid: true, error: null, result: 0 })
  })

  it('.type', function () {
    let schema = AJS('typeSchema', { type: 'any' })
    assert.deepEqual(schema.validate(0), { valid: true, error: null, result: 0 })
    assert.deepEqual(schema.validate('0'), { valid: true, error: null, result: '0' })
    assert.deepEqual(schema.validate(true), { valid: true, error: null, result: true })

    schema = AJS('typeSchema', { type: 'number' })
    assert.deepEqual(schema.validate(0), { valid: true, error: null, result: 0 })
    assert.deepEqual(schema.validate('0'), { valid: false,
      error:
       {
         validator: 'type',
         actual: '0',
         expected: { type: 'number' },
         path: '$',
         schema: 'typeSchema' },
      result: '0'
    })

    function checkIsObject (actual) {
      if (typeof actual === 'object') {
        return actual
      } else {
        throw 'Not object!'
      }
    }
    schema = AJS('typeSchema', { type: checkIsObject })
    assert.deepEqual(schema.validate([]), { valid: true, error: null, result: [] })
    assert.deepEqual(schema.validate({}), { valid: true, error: null, result: {} })
    assert.deepEqual(schema.validate(0), { valid: false,
      error:
       {
         validator: 'type',
         actual: 0,
         expected: { type: checkIsObject },
         path: '$',
         schema: 'typeSchema',
         originError: 'Not object!' },
      result: 0
    })

    function checkTypeAndToUpperCase (value, key, parent) {
      if (typeof value !== 'string') {
        throw 'name is not String'
      }
      return true
    }
    schema = AJS('typeSchema', {
      name: { type: checkTypeAndToUpperCase }
    })

    assert.deepEqual(schema._children.name.validate(0), {
      valid: false,
      error:
       {
         validator: 'type',
         actual: 0,
         expected: { type: checkTypeAndToUpperCase },
         path: '$.name',
         schema: 'typeSchema',
         originError: 'name is not String' },
      result: 0
    })

    schema = AJS('typeSchema', [{ type: 'string' }])
    assert.deepEqual(schema.validate('a'), {
      valid: false,
      error: {
        validator: 'type',
        actual: 'a',
        expected: [{ type: 'string' }],
        path: '$[]',
        schema: 'typeSchema'
      },
      result: 'a'
    })

    schema = AJS('typeSchema', { type: 'string' })
    assert.deepEqual(schema.validate(['a']), {
      valid: false,
      error: {
        validator: 'type',
        actual: [ 'a' ],
        expected: { type: 'string' },
        path: '$',
        schema: 'typeSchema'
      },
      result: [ 'a' ]
    })
  })

  it('.eq, .equal', function () {
    const numberSchema = AJS('numberSchema', { type: 'number', eq: 0 })
    assert.deepEqual(numberSchema.validate(0), { valid: true, error: null, result: 0 })

    const stringSchema = AJS('stringSchema', { type: 'string', equal: 'haha' })
    assert.deepEqual(stringSchema.validate('hehe'), { valid: false,
      error:
       {
         validator: 'equal',
         path: '$',
         actual: 'hehe',
         expected: { type: 'string', equal: 'haha' },
         schema: 'stringSchema' },
      result: 'hehe' })
  })

  it('.gt', function () {
    const schema = AJS('numberSchema', { type: 'number', gt: 0 })
    assert.deepEqual(schema.validate(1), { valid: true, error: null, result: 1 })
    assert.deepEqual(schema.validate(0), { valid: false,
      error:
       {
         schema: 'numberSchema',
         validator: 'gt',
         actual: 0,
         expected: { type: 'number', gt: 0 },
         path: '$' },
      result: 0
    })
  })

  it('.gte', function () {
    const schema = AJS('numberSchema', { type: 'number', gte: 0 })
    assert.deepEqual(schema.validate(1), { valid: true, error: null, result: 1 })
    assert.deepEqual(schema.validate(-1), { valid: false,
      error:
       {
         schema: 'numberSchema',
         validator: 'gte',
         actual: -1,
         expected: { type: 'number', gte: 0 },
         path: '$' },
      result: -1
    })
  })

  it('.lt', function () {
    const schema = AJS('numberSchema', { type: 'number', lt: 0 })
    assert.deepEqual(schema.validate(-1), { valid: true, error: null, result: -1 })
    assert.deepEqual(schema.validate(0), { valid: false,
      error:
       {
         schema: 'numberSchema',
         validator: 'lt',
         actual: 0,
         expected: { type: 'number', lt: 0 },
         path: '$' },
      result: 0
    })
  })

  it('.lte', function () {
    const schema = AJS('numberSchema', { type: 'number', lte: 0 })
    assert.deepEqual(schema.validate(0), { valid: true, error: null, result: 0 })
    assert.deepEqual(schema.validate(1), { valid: false,
      error:
       {
         schema: 'numberSchema',
         validator: 'lte',
         actual: 1,
         expected: { type: 'number', lte: 0 },
         path: '$' },
      result: 1
    })
  })

  it('.range', function () {
    const schema = AJS('numberSchema', { type: 'number', range: [0, 10] })
    assert.deepEqual(schema.validate(0), { valid: true, error: null, result: 0 })
    assert.deepEqual(schema.validate(10), { valid: true, error: null, result: 10 })
    assert.deepEqual(schema.validate(-1), { valid: false,
      error:
       {
         schema: 'numberSchema',
         validator: 'range',
         actual: -1,
         expected: { type: 'number', range: [0, 10] },
         path: '$' },
      result: -1
    })
  })

  it('.enum', function () {
    let schema = AJS('enumSchema', { type: 'string', enum: ['aaa', 'bbb'] })
    assert.deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' })
    assert.deepEqual(schema.validate('ccc'), { valid: false,
      error:
       {
         validator: 'enum',
         actual: 'ccc',
         expected: { type: 'string', enum: ['aaa', 'bbb'] },
         path: '$',
         schema: 'enumSchema' },
      result: 'ccc'
    })

    schema = AJS('enumSchema', {
      age: { type: AJS.Types.Number, enum: [18, 19, 20] }
    })
    assert.deepEqual(schema.validate({
      age: '18'
    }), { valid: true, error: null, result: { age: 18 } })
  })

  it('.pattern', function () {
    const schema = AJS('patternSchema', { type: 'string', pattern: /^a/ })
    assert.deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' })
    assert.deepEqual(schema.validate('bbb'), { valid: false,
      error:
       {
         validator: 'pattern',
         actual: 'bbb',
         expected: { type: 'string', pattern: /^a/ },
         path: '$',
         schema: 'patternSchema' },
      result: 'bbb'
    })
  })

  it('.default', function () {
    let schema = AJS('requiredSchema', {
      name: { type: 'string' },
      age: { type: 'number', default: 18 }
    })
    assert.deepEqual(schema.validate({
      name: 'nswbmw',
      age: 26
    }), { valid: true, error: null, result: { name: 'nswbmw', age: 26 } })
    assert.deepEqual(schema.validate({
      name: 'nswbmw'
    }), { valid: true, error: null, result: { name: 'nswbmw', age: 18 } })

    assert.deepEqual(schema.validate({
      name: 'nswbmw'
    }, { default: false }), { valid: true, error: null, result: { name: 'nswbmw' } })
  })

  it('.required', function () {
    let schema = AJS('requiredSchema', {
      name: { type: 'string', required: true },
      age: { type: 'number' }
    })
    assert.deepEqual(schema.validate({ name: 1 }, { required: false }), {
      valid: false,
      error:
       {
         validator: 'type',
         path: '$.name',
         actual: 1,
         expected: { type: 'string', required: true },
         schema: 'requiredSchema' },
      result: { name: 1 } })

    assert.deepEqual(schema.validate({ name: 'nswbmw' }), { valid: true, error: null, result: { name: 'nswbmw' } })
    assert.deepEqual(schema.validate({}), { valid: false,
      error:
       {
         validator: 'required',
         actual: undefined,
         expected: { type: 'string', required: true },
         path: '$.name',
         schema: 'requiredSchema' },
      result: {} })

    assert.deepEqual(schema.validate({}, { required: false }), { valid: true, error: null, result: {} })

    // number
    schema = AJS('requiredSchema', { type: 'number', required: true })
    assert.deepEqual(schema.validate(0), { valid: true, error: null, result: 0 })

    // boolean
    schema = AJS('requiredSchema', { type: 'boolean', required: true })
    assert.deepEqual(schema.validate(true), { valid: true, error: null, result: true })
    assert.deepEqual(schema.validate(false), { valid: true, error: null, result: false })
  })

  it('.required false', function () {
    let schema = AJS('requiredSchema', { type: 'string', required: false })
    assert.deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' })
    assert.deepEqual(schema.validate(''), { valid: true, error: null, result: '' })
    assert.deepEqual(schema.validate(), { valid: true, error: null, result: undefined })
  })

  it('custom validator return boolean', function () {
    const validateAAA = function (actual) {
      return actual === 'aaa'
    }
    const schema = AJS('validateSchema', { type: 'string', validateAAA: validateAAA })
    assert.deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' })
    assert.deepEqual(schema.validate('bbb'), { valid: false,
      error:
       {
         validator: 'validateAAA',
         actual: 'bbb',
         expected: { type: 'string', validateAAA: validateAAA },
         path: '$',
         schema: 'validateSchema' },
      result: 'bbb'
    })
  })

  it('custom validator throw error', function () {
    const validateAAA = function (actual) {
      if (actual !== 'aaa') {
        throw 'not equal aaa'
      }
      return true
    }
    const schema = AJS('validateSchema', { type: 'string', validateAAA: validateAAA })
    assert.deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' })
    assert.deepEqual(schema.validate('bbb'), { valid: false,
      error:
       {
         validator: 'validateAAA',
         actual: 'bbb',
         expected: { type: 'string', validateAAA: validateAAA },
         path: '$',
         schema: 'validateSchema',
         originError: 'not equal aaa' },
      result: 'bbb'
    })
  })

  it('ObjectId', function () {
    function ObjectId (actual, key, parent) {
      if (!actual || !validator.isMongoId(actual.toString())) {
        return false
      }
      parent[key] = toObjectId(actual)
      return true
    }

    const postSchema = AJS('postSchema', {
      commentIds: [{ type: ObjectId }]
    })

    const user = {
      commentIds: [
        '111111111111111111111111',
        '222222222222222222222222'
      ]
    }

    const result = postSchema.validate(user)
    assert.deepEqual(result.valid, true)
    assert.deepEqual(result.error, null)
    assert.deepEqual(result.result.commentIds[0] instanceof toObjectId, true)
    assert.deepEqual(result.result.commentIds[1] instanceof toObjectId, true)
  })
})
