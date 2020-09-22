const AJS = require('..')
const { deepEqual } = require('./_util')

describe('compile', function () {
  it('error: schema type', function () {
    try {
      AJS(111, 222)
    } catch (e) {
      deepEqual(!!e.message.match(/Schema must be object or array/), true)
    }
  })

  it('error: schema value is null', function () {
    try {
      AJS({
        type: null
      })
    } catch (e) {
      deepEqual(!!e.message.match(/Schema key "type" is null, Schema is/), true)
    }
  })

  it('leaf', function () {
    const schema1 = AJS({ type: 'string' })
    deepEqual(schema1, {
      _leaf: true,
      _children: { type: 'string' },
      _parent: null,
      _path: '$',
      _schema: { type: 'string' }
    })

    const schema2 = AJS([{ type: 'string' }])
    deepEqual(schema2, {
      _array: true,
      _leaf: true,
      _children: { type: 'string' },
      _parent: null,
      _path: '$[]',
      _schema: [{ type: 'string' }]
    })

    const schema3 = AJS('stringSchema', [{ type: 'string' }])
    deepEqual(schema3, {
      _array: true,
      _leaf: true,
      _name: 'stringSchema',
      _children: { type: 'string' },
      _parent: null,
      _path: '$[]',
      _schema: [{ type: 'string' }]
    })
  })

  it('object', function () {
    let schema1 = AJS({
      author: {
        type: 'string',
        age: { type: 'number' }
      }
    })
    let schema2 = AJS({
      author: AJS({
        type: 'string',
        age: { type: 'number' }
      })
    })

    try {
      deepEqual(schema1, schema2)
    } catch (e) {
      deepEqual(e.message, 'Maximum call stack size exceeded')
    }

    schema1 = AJS({
      author: {
        type: { type: 'string' },
        age: { type: 'number' }
      }
    })
    schema2 = AJS({
      author: AJS({
        type: AJS({ type: 'string' }),
        age: { type: 'number' }
      })
    })

    try {
      deepEqual(schema1, schema2)
    } catch (e) {
      deepEqual(e.message, 'Maximum call stack size exceeded')
    }

    schema1 = AJS({
      author: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    })
    schema2 = AJS({
      author: AJS({
        name: { type: 'string' },
        age: { type: 'number' }
      })
    })
    const schema3 = AJS({
      author: AJS({
        name: AJS({ type: 'string' }),
        age: { type: 'number' }
      })
    })
    try {
      deepEqual(schema1, schema2)
    } catch (e) {
      deepEqual(e.message, 'Maximum call stack size exceeded')
    }
    try {
      deepEqual(schema1, schema3)
    } catch (e) {
      deepEqual(e.message, 'Maximum call stack size exceeded')
    }
  })

  it('array', function () {
    const schema1 = AJS([{
      authors: [{
        names: [{ type: 'string' }],
        age: { type: 'number' }
      }]
    }])
    const schema2 = AJS([{
      authors: AJS([{
        names: [{ type: 'string' }],
        age: { type: 'number' }
      }])
    }])
    const schema3 = AJS([{
      authors: AJS([{
        names: AJS([{ type: 'string' }]),
        age: { type: 'number' }
      }])
    }])
    try {
      deepEqual(schema1, schema2)
    } catch (e) {
      deepEqual(e.message, 'Maximum call stack size exceeded')
    }
    try {
      deepEqual(schema1, schema3)
    } catch (e) {
      deepEqual(e.message, 'Maximum call stack size exceeded')
    }
  })
})
