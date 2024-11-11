const AJS = require('..')
const { deepEqual } = require('./_util')
const validator = require('validator')
const toObjectId = require('mongodb').ObjectId

describe('helper', function () {
  it('error', function () {
    try {
      AJS.register('gt')
    } catch (e) {
      deepEqual(e.message, 'Missing name or fn')
    }
  })

  it('.gt18', function () {
    AJS.register('gt18', function (actual, expected) {
      return expected ? (actual > 18) : (actual <= 18)
    })
    const schema = AJS('adultSchema', { type: 'number', gt18: true })
    deepEqual(schema, {
      _leaf: true,
      _name: 'adultSchema',
      _children: { type: 'number', gt18: true },
      _parent: null,
      _path: '$',
      _schema: { type: 'number', gt18: true }
    })
    deepEqual(schema.validate(19), { valid: true, error: null, result: 19 })
    deepEqual(schema.validate(0), { valid: false,
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
    deepEqual(schema.validate(0, { gt18: false }), { valid: true, error: null, result: 0 })
  })

  it('.type', function () {
    let schema = AJS('typeSchema', { type: 'any' })
    deepEqual(schema.validate(0), { valid: true, error: null, result: 0 })
    deepEqual(schema.validate('0'), { valid: true, error: null, result: '0' })
    deepEqual(schema.validate(true), { valid: true, error: null, result: true })

    schema = AJS('typeSchema', { type: 'number' })
    deepEqual(schema.validate(0), { valid: true, error: null, result: 0 })
    deepEqual(schema.validate('0'), { valid: false,
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
    deepEqual(schema.validate([]), { valid: true, error: null, result: [] })
    deepEqual(schema.validate({}), { valid: true, error: null, result: {} })
    deepEqual(schema.validate(0), { valid: false,
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

    deepEqual(schema._children.name.validate(0), {
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
    deepEqual(schema.validate('a'), {
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
    deepEqual(schema.validate(['a']), {
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
    deepEqual(numberSchema.validate(0), { valid: true, error: null, result: 0 })

    const stringSchema = AJS('stringSchema', { type: 'string', equal: 'haha' })
    deepEqual(stringSchema.validate('hehe'), { valid: false,
      error:
       {
         validator: 'equal',
         path: '$',
         actual: 'hehe',
         expected: { type: 'string', equal: 'haha' },
         schema: 'stringSchema' },
      result: 'hehe' })
  })

  it('.length', function () {
    const stringSchema = AJS('stringSchema', { type: 'string', length: 1 })
    deepEqual(stringSchema.validate('a'), { valid: true, error: null, result: 'a' })
    deepEqual(stringSchema.validate('hehe'), { valid: false,
      error:
       {
         validator: 'length',
         path: '$',
         actual: 'hehe',
         expected: { type: 'string', length: 1 },
         schema: 'stringSchema' },
      result: 'hehe' })

    const stringSchema2 = AJS('stringSchema2', { type: 'string', length: [1, 2] })
    deepEqual(stringSchema2.validate('a'), { valid: true, error: null, result: 'a' })
    deepEqual(stringSchema2.validate('hehe'), { valid: false,
      error:
       {
         validator: 'length',
         path: '$',
         actual: 'hehe',
         expected: { type: 'string', length: [1, 2] },
         schema: 'stringSchema2' },
      result: 'hehe' })
  })

  it('.gt', function () {
    const schema = AJS('numberSchema', { type: 'number', gt: 0 })
    deepEqual(schema.validate(1), { valid: true, error: null, result: 1 })
    deepEqual(schema.validate(0), { valid: false,
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
    deepEqual(schema.validate(1), { valid: true, error: null, result: 1 })
    deepEqual(schema.validate(-1), { valid: false,
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
    deepEqual(schema.validate(-1), { valid: true, error: null, result: -1 })
    deepEqual(schema.validate(0), { valid: false,
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
    deepEqual(schema.validate(0), { valid: true, error: null, result: 0 })
    deepEqual(schema.validate(1), { valid: false,
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
    deepEqual(schema.validate(0), { valid: true, error: null, result: 0 })
    deepEqual(schema.validate(10), { valid: true, error: null, result: 10 })
    deepEqual(schema.validate(-1), { valid: false,
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
    deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' })
    deepEqual(schema.validate('ccc'), { valid: false,
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
    deepEqual(schema.validate({
      age: '18'
    }), { valid: true, error: null, result: { age: 18 } })
  })

  it('.pattern', function () {
    const schema = AJS('patternSchema', { type: 'string', pattern: /^a/ })
    deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' })
    deepEqual(schema.validate('bbb'), { valid: false,
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

  it('.trim', function () {
    // no trim
    const schema = AJS('trimSchema', {
      email: { type: 'string', isEmail: true }
    })
    deepEqual(schema.validate({
      email: 'test@gmail.com'
    }), { valid: true, error: null, result: { email: 'test@gmail.com' } })
    deepEqual(schema.validate({ email: 'test@gmail.com ' }), { valid: false,
      error:
       {
         validator: 'isEmail',
         actual: 'test@gmail.com ',
         expected: { type: 'string', isEmail: true },
         path: '$.email',
         schema: 'trimSchema' },
      result: { email: 'test@gmail.com ' }
    })

    // trim: false
    const schema2 = AJS('trimSchema', {
      email: { type: 'string', isEmail: true, trim: false }
    })
    deepEqual(schema2.validate({
      email: 'test@gmail.com'
    }), { valid: true, error: null, result: { email: 'test@gmail.com' } })
    deepEqual(schema2.validate({ email: 'test@gmail.com ' }), { valid: false,
      error:
       {
         validator: 'isEmail',
         actual: 'test@gmail.com ',
         expected: { type: 'string', isEmail: true, trim: false },
         path: '$.email',
         schema: 'trimSchema' },
      result: { email: 'test@gmail.com ' }
    })

    // trim: true
    const schema3 = AJS('trimSchema', {
      email: { type: 'string', trim: true, isEmail: true }
    })
    deepEqual(schema3.validate({
      email: 'test@gmail.com'
    }), { valid: true, error: null, result: { email: 'test@gmail.com' } })
    deepEqual(schema3.validate({
      email: 'test@gmail.com '
    }), { valid: true, error: null, result: { email: 'test@gmail.com' } })

    const schema4 = AJS('trimSchema', {
      age: { type: 'number', trim: true }
    })
    deepEqual(schema4.validate({
      age: 18
    }), { valid: true, error: null, result: { age: 18 } })
  })

  it('.default', function () {
    let schema = AJS('requiredSchema', {
      name: { type: 'string' },
      age: { type: 'number', default: 18 }
    })
    deepEqual(schema.validate({
      name: 'nswbmw',
      age: 26
    }), { valid: true, error: null, result: { name: 'nswbmw', age: 26 } })
    deepEqual(schema.validate({
      name: 'nswbmw'
    }), { valid: true, error: null, result: { name: 'nswbmw', age: 18 } })

    deepEqual(schema.validate({
      name: 'nswbmw'
    }, { default: false }), { valid: true, error: null, result: { name: 'nswbmw' } })
  })

  it('.default with function', function () {
    let schema = AJS('requiredSchema', {
      timestamp: { type: AJS.Types.Date, default: Date.now }
    })
    deepEqual(schema.validate({
      timestamp: 1547113058878
    }), { valid: true, error: null, result: { timestamp: new Date(1547113058878) } })

    const result = schema.validate({}).result
    deepEqual(!!result.timestamp, true)
    deepEqual(typeof result.timestamp, 'object')
  })

  it('.required', function () {
    let schema = AJS('requiredSchema', {
      name: { type: 'string', required: true },
      age: { type: 'number' }
    })
    deepEqual(schema.validate({ name: 1 }, { required: false }), {
      valid: false,
      error:
       {
         validator: 'type',
         path: '$.name',
         actual: 1,
         expected: { type: 'string', required: true },
         schema: 'requiredSchema' },
      result: { name: 1 } })

    deepEqual(schema.validate({ name: 'nswbmw' }), { valid: true, error: null, result: { name: 'nswbmw' } })
    deepEqual(schema.validate({}), { valid: false,
      error:
       {
         validator: 'required',
         actual: undefined,
         expected: { type: 'string', required: true },
         path: '$.name',
         schema: 'requiredSchema' },
      result: {} })

    deepEqual(schema.validate({}, { required: false }), { valid: true, error: null, result: {} })

    // number
    schema = AJS('requiredSchema', { type: 'number', required: true })
    deepEqual(schema.validate(0), { valid: true, error: null, result: 0 })

    // boolean
    schema = AJS('requiredSchema', { type: 'boolean', required: true })
    deepEqual(schema.validate(true), { valid: true, error: null, result: true })
    deepEqual(schema.validate(false), { valid: true, error: null, result: false })
  })

  it('.required false', function () {
    let schema = AJS('requiredSchema', { type: 'string', required: false })
    deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' })
    deepEqual(schema.validate(''), { valid: true, error: null, result: '' })
    deepEqual(schema.validate(), { valid: true, error: null, result: undefined })
  })

  it('custom validator return boolean', function () {
    const validateAAA = function (actual) {
      return actual === 'aaa'
    }
    const schema = AJS('validateSchema', { type: 'string', validateAAA: validateAAA })
    deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' })
    deepEqual(schema.validate('bbb'), { valid: false,
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
    deepEqual(schema.validate('aaa'), { valid: true, error: null, result: 'aaa' })
    deepEqual(schema.validate('bbb'), { valid: false,
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

  describe("validator's isXxx", function () {
    it('validator.isEmail', function () {
      const schema = AJS('validateSchema', {
        type: 'string',
        isEmail: true
      })
      deepEqual(schema.validate('a@b.com'), { valid: true, error: null, result: 'a@b.com' })

      const numberSchema = AJS('numberSchema', {
        type: 'number',
        isEmail: true
      })
      deepEqual(numberSchema.validate(1), { valid: false,
        error:
         {
           validator: 'isEmail',
           actual: 1,
           expected: { type: 'number', isEmail: true },
           path: '$',
           schema: 'numberSchema' },
        result: 1
      })

      deepEqual(schema.validate('bbb'), { valid: false,
        error:
         {
           validator: 'isEmail',
           actual: 'bbb',
           expected: { type: 'string', isEmail: true },
           path: '$',
           schema: 'validateSchema' },
        result: 'bbb'
      })
    })

    it('validator.isIP', function () {
      const IPV4Schema = AJS('validateSchema', {
        type: 'string',
        isIP: [4, true]
      })
      deepEqual(IPV4Schema.validate('8.8.8.8'), { valid: true, error: null, result: '8.8.8.8' })

      deepEqual(IPV4Schema.validate('CDCD:910A:2222:5498:8475:1111:3900:2020'), { valid: false,
        error:
         {
           validator: 'isIP',
           actual: 'CDCD:910A:2222:5498:8475:1111:3900:2020',
           expected: { type: 'string', isIP: [4, true] },
           path: '$',
           schema: 'validateSchema' },
        result: 'CDCD:910A:2222:5498:8475:1111:3900:2020'
      })

      const IPV6Schema = AJS('validateSchema', {
        type: 'string',
        isIP: [6, true]
      })
      deepEqual(IPV6Schema.validate('CDCD:910A:2222:5498:8475:1111:3900:2020'), { valid: true, error: null, result: 'CDCD:910A:2222:5498:8475:1111:3900:2020' })

      deepEqual(IPV6Schema.validate('8.8.8.8'), { valid: false,
        error:
         {
           validator: 'isIP',
           actual: '8.8.8.8',
           expected: { type: 'string', isIP: [6, true] },
           path: '$',
           schema: 'validateSchema' },
        result: '8.8.8.8'
      })
    })
  })
})
