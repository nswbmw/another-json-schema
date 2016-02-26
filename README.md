### another-json-schema

Another JSON Schema, simple & flexible & intuitive.

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

### Install

```
npm i anothor-json-schema --save
```

### Usage

```
var AJS = require('anothor-json-schema');

var userSchema = AJS('userSchema', {
  _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
  name: { type: 'string', required: true },
  age: { type: 'number', gte: 18 },
  gender: { type: 'string', enum: ['male', 'female'] }
});

var commentSchema = AJS('commentSchema', {
  _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
  user: userSchema,
  content: { type: 'string', required: true }
});

var postSchema = AJS('postSchema', {
  _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
  author: userSchema,
  content: { type: 'string', required: true },
  comments: [commentSchema]
});

var post = {
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
};

var output = postSchema.validate(post);

assert.deepEqual(output.error.message, '($.comments[].user._id: "wrong_id") ✖ (pattern: /^[0-9a-z]{24}$/)');
assert.deepEqual(output, {
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
});
```

### API

#### AJS([name], schema)

Constructor.

#### AJS.register(name, fn)

Register a validator. eg:

```
AJS.register('gt', function (actual, expected, key, parentNode) {
  return actual > expected;
});
```

#### schema.compile([name], schema)

Compile a schema. The following two ways are the same:

```
var userSchema = AJS('userSchema', {
  _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
  name: { type: 'string', required: true },
  age: { type: 'number', gte: 18 },
  gender: { type: 'string', enum: ['male', 'female'] }
});
```

```
var newSchema = new AJS();
var userSchema = newSchema.compile({
  _id: { type: 'string', pattern: /^[0-9a-z]{24}$/ },
  name: { type: 'string', required: true },
  age: { type: 'number', gte: 18 },
  gender: { type: 'string', enum: ['male', 'female'] }
});
```

#### schema.validate(compiledSchema, [opts])

Use the compiled template to validate a json. returns a object:

- valid: {Boolean}
- error: {Error|null}
- result: {Any}

opts:

- additionalProperties: {Boolean} if true, retain the original field. default `false`
- gt, gte, lt, lte ...: {Boolean} if false, will not execute this build-in validator.

error:

- message: error message, eg: `($.comments[].user._id: "wrong_id") ✖ (pattern: /^[0-9a-z]{24}$/)`
- validator: validator name, eg: `pattern`,
- actual: actual value, eg: `wrong_id`,
- expected: expected schema, eg: `{ type: 'string', pattern: /^[0-9a-z]{24}$/ }`,
- path: path in object, eg: `$.comments[].user._id`,
- schema: schema name, eg: `userSchema`

### More examples

see [test](./test).

### Test

```
npm test (coverage 100%)
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
