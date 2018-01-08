### another-json-schema

Another JSON Schema, simple & flexible & intuitive.

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

### Install

```sh
$ npm i another-json-schema --save
```

### Usage

### Simple

```js
const AJS = require('another-json-schema')

const userSchema = AJS('userSchema', {
  name: { type: 'string', required: true },
  age: { type: 'number', gte: 18 },
  gender: { type: 'string', enum: ['male', 'female'], default: 'male' }
})

// test `required`
console.log(userSchema.validate({ age: 18 }))
/*
{ valid: false,
  error:
   { TypeError: ($.name: undefined) ✖ (required: true)
     validator: 'required',
     actual: undefined,
     expected: { type: 'string', required: true },
     path: '$.name',
     schema: 'userSchema' },
  result: { age: 18 } }
*/

// test `default`
const data = { name: 'nswbmw', age: 18 }
console.log(userSchema.validate(data))
/*
{ valid: true,
  error: null,
  result: { name: 'nswbmw', age: 18, gender: 'male' } }
*/
console.log(data)
// { name: 'nswbmw', age: 18, gender: 'male' }

// test `enum`
console.log(userSchema.validate({ name: 'nswbmw', age: 18, gender: 'lalala' }))
/*
{ valid: false,
  error:
   { TypeError: ($.gender: "lalala") ✖ (enum: male,female)
     validator: 'enum',
     actual: 'lalala',
     expected: { type: 'string', enum: ['male', 'female'], default: 'male' },
     path: '$.gender',
     schema: 'userSchema' },
  result: { name: 'nswbmw', age: 18, gender: 'lalala' } }
*/

// test `gte`
console.log(userSchema.validate({ name: 'nswbmw', age: 17 }))
/*
{ valid: false,
  error:
   { TypeError: ($.age: 17) ✖ (gte: 18)
     validator: 'gte',
     actual: 17,
     expected: { type: 'number', gte: 18 },
     path: '$.age',
     schema: 'userSchema' },
  result: { name: 'nswbmw', age: 17 } }
*/
```

### Nested

```js
const AJS = require('another-json-schema')

const userSchema = AJS('userSchema', {
  _id: { type: 'string', pattern: /^[0-9a-z]{24}$/, required: true },
  name: { type: 'string' },
  age: { type: 'number', gte: 18 },
  gender: { type: 'string', enum: ['male', 'female'] }
})

const commentSchema = AJS('commentSchema', {
  _id: { type: 'string', pattern: /^[0-9a-z]{24}$/, required: true },
  user: userSchema,
  content: { type: 'string' }
})

const postSchema = AJS('postSchema', {
  _id: { type: 'string', pattern: /^[0-9a-z]{24}$/, required: true },
  author: userSchema,
  content: { type: 'string' },
  comments: [commentSchema]
})

const post = {
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
  }]
}

console.log(postSchema.validate(post))
/*
{ valid: false,
  error:
   { [Error: ($.comments[].user._id: "wrong_id") ✖ (pattern: /^[0-9a-z]{24}$/)]
     validator: 'pattern',
     actual: 'wrong_id',
     expected: { type: 'string', pattern: /^[0-9a-z]{24}$/, required: true },
     path: '$.comments[].user._id',
     schema: 'userSchema' },
  result:
   { _id: 'post11111111111111111111',
     author:
      { _id: 'user11111111111111111111',
        name: 'nswbmw',
        age: 100,
        gender: 'male' },
     content: 'lalala',
     comments: [ [Object] ] } }
*/
```

### Register validator

```js
const AJS = require('another-json-schema')

AJS.register('adult', function (actual, expected, key, parent) {
  return expected ? (actual > 18) : (actual <= 18)
})
const adultSchema = AJS('adultSchema', { type: 'number', adult: true })

console.log(adultSchema.validate(19))
// { valid: true, error: null, result: 19 }
console.log(adultSchema.validate(17))
/*
{ valid: false,
  error:
   { TypeError: ($: 17) ✖ (adult: true)
     validator: 'adult',
     actual: 17,
     expected: { type: 'number', adult: true },
     path: '$',
     schema: 'adultSchema' },
  result: 17 }
*/
```

### Custom validate function

Custom ObjectId validator, check whether ObjectId then wrap `_id` string to ObjectId.

```js
const AJS = require('another-json-schema')
const validator = require('validator')
const toObjectId = require('mongodb').ObjectId

function ObjectId(actual, key, parent) {
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

console.log(postSchema.validate(user))
/*
{ valid: true,
  error: null,
  result: { commentIds: [ 111111111111111111111111, 222222222222222222222222 ] } }
*/

//validate specific field
console.log(postSchema._children.commentIds.validate('lalala'))
/*
{ valid: false,
  error:
   { TypeError: ($.commentIds[]: "lalala") ✖ (type: ObjectId)
     validator: 'type',
     path: '$.commentIds[]',
     actual: 'lalala',
     expected: [ [Object] ],
     schema: 'postSchema' },
  result: 'lalala' }
*/
```

#### Ignore validator

```js
const AJS = require('another-json-schema')

const userSchema = AJS('userSchema', {
  _id: { type: 'number', range: [1, 100] }
})

const user = {
  _id: 0
}

console.log(userSchema.validate(user))
/*
{ valid: false,
  error:
   { TypeError: ($._id: 0) ✖ (range: 1,100)
     validator: 'range',
     actual: 0,
     expected: { type: 'number', range: [Array] },
     path: '$._id',
     schema: 'userSchema' },
  result: { _id: 0 } }
*/
console.log(userSchema.validate(user, { range: false }))
// { valid: true, error: null, result: { _id: 0 } }
```

**NB**: `type` validator cannot ignore by passing `false`.

### API

#### AJS([name], schema)

Constructor.

#### AJS.register(name, fn)

Register a validator. eg:

```js
AJS.register('adult', function (actual, expected, key, parent) {
  return expected ? (actual > 18) : (actual <= 18)
})
```

#### ajs.compile([name], schema)

Compile a schema. The following two ways are the same:

```js
const userSchema = AJS('userSchema', {
  _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
  name: { type: 'string' },
  age: { type: 'number', gte: 18 },
  gender: { type: 'string', enum: ['male', 'female'] }
})
```

```js
const newSchema = new AJS()
const userSchema = newSchema.compile('userSchema', {
  _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
  name: { type: 'string' },
  age: { type: 'number', gte: 18 },
  gender: { type: 'string', enum: ['male', 'female'] }
})
```

#### compiledSchema.validate(data, [opts])

Use the compiled validator to validate an object. it will modify the original object and return it:

- valid: {Boolean} wether a valid object
- error: {Error|null}
  - message: error message, eg: `($.comments[].user._id: "wrong_id") ✖ (pattern: /^[0-9a-z]{24}$/)`
  - validator: validator name, eg: `pattern`,
  - actual: actual value, eg: `wrong_id`,
  - expected: expected schema, eg: `{ type: 'string', pattern: /^[0-9a-z]{24}$/ }`,
  - path: path in object, eg: `$.comments[].user._id`,
  - schema: schema name, eg: `userSchema`
  - originError: original error thrown from validator
- result: {Any}

opts:

- additionalProperties: {Boolean} if true, retain the original field. default `false`
- ignoreNodeType: {Boolean} if true, ignore check node type, like: `[]`. default: `false`
- gt, gte, lt, lte ...: {Boolean} if false, will not execute this validator.

### Built-in validators

- type
- gt
- gte
- lt
- lte
- range
- enum
- pattern
- default
- required

### More examples

see [test](./test).

### Test

```sh
$ npm test (coverage 100%)
```

### License

MIT

[npm-image]: https://img.shields.io/npm/v/another-json-schema.svg?style=flat-square
[npm-url]: https://npmjs.org/package/another-json-schema
[travis-image]: https://img.shields.io/travis/nswbmw/another-json-schema.svg?style=flat-square
[travis-url]: https://travis-ci.org/nswbmw/another-json-schema
[david-image]: http://img.shields.io/david/nswbmw/another-json-schema.svg?style=flat-square
[david-url]: https://david-dm.org/nswbmw/another-json-schema
[license-image]: http://img.shields.io/npm/l/another-json-schema.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/another-json-schema.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/another-json-schema
