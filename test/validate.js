const AJS = require('..')
const { deepEqual } = require('./_util')

describe('validate', function () {
  it('error', function () {
    const schema = AJS()
    try {
      schema.validate(0)
    } catch (e) {
      deepEqual(e.message, 'No schema assigned, please call .compile(schema)')
    }
  })

  it('_customErrorMsg', function () {
    const userSchema = AJS('userSchema', {
      name: { type: 'string', required: true },
      age: {
        type: 'number',
        gte: 18,
        _customErrorMsg: {
          gte: '您未满 18 岁'
        }
      }
    })

    deepEqual(userSchema.validate({
      name: 'nswbmw',
      age: 17
    }).error.message, '您未满 18 岁')
  })

  it('additionalProperties', function () {
    var userSchema = AJS('userSchema', {
      _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
      name: { type: 'string', required: true },
      age: { type: 'number', gte: 18 },
      gender: { type: 'string', enum: ['male', 'female'] }
    })

    deepEqual(userSchema.validate({
      _id: '111111111111111111111111',
      name: 'nswbmw',
      age: 100,
      gender: 'male',
      pet: 'cat'
    }), {
      valid: true,
      error: null,
      result:
       { _id: '111111111111111111111111',
         name: 'nswbmw',
         age: 100,
         gender: 'male' }
    })

    deepEqual(userSchema.validate({
      _id: '111111111111111111111111',
      name: 'nswbmw',
      age: 100,
      gender: 'male',
      pet: 'cat'
    }, { additionalProperties: true }), {
      valid: true,
      error: null,
      result:
       { _id: '111111111111111111111111',
         name: 'nswbmw',
         age: 100,
         gender: 'male',
         pet: 'cat' }
    })
  })

  it('ignoreNodeType', function () {
    let userSchema = AJS('userSchema', {
      posts: [{ type: 'string' }]
    })

    deepEqual(userSchema.validate({
      posts: '1'
    }), {
      valid: false,
      error: {
        validator: 'type',
        path: '$.posts[]',
        actual: '1',
        expected: [ { type: 'string' } ],
        schema: 'userSchema'
      },
      result: { posts: '1' }
    })

    deepEqual(userSchema.validate({
      posts: '1'
    }, { ignoreNodeType: true }), {
      valid: true,
      error: null,
      result: { posts: '1' }
    })

    userSchema = AJS('userSchema', {
      posts: { type: 'string' }
    })

    deepEqual(userSchema.validate({
      posts: ['1', '2', '3']
    }, { ignoreNodeType: true }), {
      valid: true,
      error: null,
      result: { posts: ['1', '2', '3'] }
    })
  })

  it('normal', function () {
    let schema = AJS({ type: 'string' })
    deepEqual(schema.validate('1'), { valid: true, error: null, result: '1' })
    deepEqual(schema.validate(1), { valid: false,
      error:
       {
         validator: 'type',
         actual: 1,
         expected: { type: 'string' },
         path: '$',
         schema: undefined },
      result: 1
    })

    schema = AJS([{ type: 'string' }])
    deepEqual(schema.validate(['1']), { valid: true, error: null, result: ['1'] })
    deepEqual(schema.validate([2, '1']), { valid: false,
      error:
       {
         validator: 'type',
         actual: 2,
         expected: [{ type: 'string' }],
         path: '$[]',
         schema: undefined },
      result: [2, '1']
    })

    schema = AJS([AJS({ type: 'string' })])
    deepEqual(schema.validate(['1']), { valid: true, error: null, result: ['1'] })
    deepEqual(schema.validate(['1', 2]), { valid: false,
      error:
       {
         validator: 'type',
         actual: 2,
         expected: [{ type: 'string' }],
         path: '$[]',
         schema: undefined },
      result: ['1', 2]
    })

    let userSchema = AJS('userSchema', {
      _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
      nicknames: [{ type: 'string' }]
    })
    deepEqual(userSchema._children._id.validate('1'), {
      valid: false,
      error: {
        validator: 'pattern',
        actual: '1',
        expected: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
        path: '$._id',
        schema: 'userSchema' },
      result: '1' })
    deepEqual(userSchema.validate({
      _id: '111111111111111111111111',
      nicknames: ['nswbmw', 'xiaoxingxing'],
      other: 'blabla'
    }), { valid: true,
      error: null,
      result:
       { _id: '111111111111111111111111',
         nicknames: [ 'nswbmw', 'xiaoxingxing' ] }
    })

    userSchema = AJS('userSchema', {
      _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
      nicknames: [{ type: 'string' }]
    })

    deepEqual(userSchema.validate({
      _id: '111111111111111111111111',
      nicknames: 'nswbmw'
    }).error.message, '($.nicknames[]: "nswbmw") ✖ (type: array)')
    deepEqual(userSchema.validate({
      _id: '111111111111111111111111',
      nicknames: 'nswbmw'
    }), { valid: false,
      error:
       {
         validator: 'type',
         actual: 'nswbmw',
         expected: [{ type: 'string' }],
         path: '$.nicknames[]',
         schema: 'userSchema' },
      result: { _id: '111111111111111111111111', nicknames: 'nswbmw' }
    })

    userSchema = AJS('userSchema', {
      _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
      nicknames: [{ type: 'string' }]
    })
    deepEqual(userSchema.validate(1).error.message, '($: 1) ✖ (type: object)')

    const commentSchema = AJS('commentSchema', {
      _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
      content: { type: 'string', required: true }
    })

    deepEqual(commentSchema.validate({
      _id: '111111111111111111111111',
      content: ['haha', 'hehe']
    }), { valid: false,
      error:
       {
         validator: 'type',
         actual: [ 'haha', 'hehe' ],
         expected: { type: 'string', required: true },
         path: '$.content',
         schema: 'commentSchema' },
      result: { _id: '111111111111111111111111', content: [ 'haha', 'hehe' ] } })
  })

  it('complex', function () {
    var userSchema = AJS('userSchema', {
      _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
      name: { type: 'string', required: true },
      age: { type: 'number', gte: 18 },
      gender: { type: 'string', enum: ['male', 'female'] }
    })
    var commentSchema = AJS('commentSchema', {
      _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
      user: userSchema,
      content: { type: 'string', required: true }
    })
    var postSchema = AJS('postSchema', {
      _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
      author: userSchema,
      content: { type: 'string', required: true },
      comments: [commentSchema]
    })

    var post1 = {
      _id: 'post11111111111111111111',
      author: {
        _id: 'user11111111111111111111',
        name: 'nswbmw',
        age: 100,
        gender: 'male',
        pet: 'cat'
      },
      content: 'lalala',
      comments: [{
        _id: 'comment11111111111111111',
        user: {
          _id: 'user11111111111111111111',
          name: 'user1',
          age: 100,
          gender: 'male'
        },
        content: 'sofa'
      }, {
        _id: 'comment22222222222222222',
        user: {
          _id: 'user22222222222222222222',
          name: 'user2',
          age: 100,
          gender: 'female'
        },
        content: 'bench'
      }]
    }
    deepEqual(postSchema.validate(post1), {
      valid: true,
      error: null,
      result: {
        _id: 'post11111111111111111111',
        author: {
          _id: 'user11111111111111111111',
          name: 'nswbmw',
          age: 100,
          gender: 'male'
        },
        content: 'lalala',
        comments: [{
          _id: 'comment11111111111111111',
          user: {
            _id: 'user11111111111111111111',
            name: 'user1',
            age: 100,
            gender: 'male'
          },
          content: 'sofa'
        }, {
          _id: 'comment22222222222222222',
          user: {
            _id: 'user22222222222222222222',
            name: 'user2',
            age: 100,
            gender: 'female'
          },
          content: 'bench'
        }]
      }
    })

    var post2 = {
      _id: 'post11111111111111111111',
      author: {
        _id: 'user11111111111111111111',
        name: 'nswbmw',
        age: 100,
        gender: 'male',
        pet: 'cat'
      },
      content: 'lalala',
      comments: [{
        _id: 'comment11111111111111111',
        user: {
          _id: 'wrong_id',
          name: 'user1',
          age: 100,
          gender: 'male'
        },
        content: 'sofa'
      }, {
        _id: 'comment22222222222222222',
        user: {
          _id: 'user22222222222222222222',
          name: 'user2',
          age: 100,
          gender: 'female'
        },
        content: 'bench'
      }]
    }

    var post3 = {
      _id: 'post11111111111111111111',
      author: {
        _id: 'user11111111111111111111',
        name: 'nswbmw',
        age: 100,
        gender: 'male',
        pet: 'cat'
      },
      content: 'lalala',
      comments: 'haha'
    }
    deepEqual(postSchema.validate(post2).error.message, '($.comments[].user._id: "wrong_id") ✖ (pattern: /^[0-9a-z]{24}$/)')
    deepEqual(postSchema.validate(post2), {
      valid: false,
      error: {
        validator: 'pattern',
        actual: 'wrong_id',
        expected: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
        path: '$.comments[].user._id',
        schema: 'userSchema' },
      result: {
        _id: 'post11111111111111111111',
        author: { _id: 'user11111111111111111111',
          name: 'nswbmw',
          age: 100,
          gender: 'male'
        },
        content: 'lalala',
        comments: [{
          _id: 'comment11111111111111111',
          user: {
            _id: 'wrong_id',
            name: 'user1',
            age: 100,
            gender: 'male'
          },
          content: 'sofa'
        }, {
          _id: 'comment22222222222222222',
          user: {
            _id: 'user22222222222222222222',
            name: 'user2',
            age: 100,
            gender: 'female'
          },
          content: 'bench'
        }]
      }
    })
    deepEqual(postSchema.validate(post3), {
      valid: false,
      error:
       {
         validator: 'type',
         actual: 'haha',
         expected:
          [ { _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
            user:
             { _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
               name: { type: 'string', required: true },
               age: { type: 'number', gte: 18 },
               gender: { type: 'string', enum: ['male', 'female'] } },
            content: { type: 'string', required: true } } ],
         path: '$.comments[]',
         schema: 'commentSchema' },
      result:
       { _id: 'post11111111111111111111',
         author:
          { _id: 'user11111111111111111111',
            name: 'nswbmw',
            age: 100,
            gender: 'male' },
         content: 'lalala',
         comments: 'haha' } })
  })
})
