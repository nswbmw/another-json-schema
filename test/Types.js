const AJS = require('..')
const assert = require('assert')

const UserSchema = AJS('User', {
  uid: { type: AJS.Types.ObjectId },
  string: { type: AJS.Types.String },
  number: { type: AJS.Types.Number },
  date: { type: AJS.Types.Date },
  buffer: { type: AJS.Types.Buffer },
  boolean: { type: AJS.Types.Boolean },
  mixed: { type: AJS.Types.Mixed }
})

describe('Types', function () {
  it('ObjectId', function () {
    let user = UserSchema.validate({ uid: 'xxx' })
    assert.deepEqual(user.valid, false)

    user = UserSchema.validate({ uid: '111111111111111111111111' })
    assert.deepEqual(user.valid, true)
    assert.deepEqual(user.result.uid.toString(), '111111111111111111111111')
  })

  it('String', function () {
    let user = UserSchema.validate({ string: 111 })
    assert.deepEqual(user.valid, true)
    assert.deepEqual(user.result.string, '111')
  })

  it('Number', function () {
    let user = UserSchema.validate({ number: 1.2 })
    assert.deepEqual(user.valid, true)
    assert.deepEqual(user.result.number, 1.2)

    user = UserSchema.validate({ number: 'haha' })
    assert.deepEqual(user.valid, false)
  })

  it('Date', function () {
    let user = UserSchema.validate({ date: '2018-04-13' })
    assert.deepEqual(user.valid, true)
    assert.deepEqual(typeof user.result.date, 'object')
    assert.deepEqual(user.result.date, new Date('2018-04-13'))

    user = UserSchema.validate({ date: 'haha' })
    assert.deepEqual(user.valid, false)
  })

  it('Buffer', function () {
    let user = UserSchema.validate({ buffer: '123' })
    assert.deepEqual(user.valid, true)
    assert.deepEqual(Buffer.isBuffer(user.result.buffer), true)
    assert.deepEqual(user.result.buffer.toString(), '123')

    user = UserSchema.validate({ buffer: Buffer.from('123') })
    assert.deepEqual(user.valid, true)
    assert.deepEqual(Buffer.isBuffer(user.result.buffer), true)
    assert.deepEqual(user.result.buffer.toString(), '123')

    user = UserSchema.validate({ buffer: 1 })
    assert.deepEqual(user.valid, false)
  })

  it('Boolean', function () {
    let user = UserSchema.validate({ boolean: 1 })
    assert.deepEqual(user.valid, true)
    assert.deepEqual(user.result.boolean, true)
  })

  it('Mixed', function () {
    let user = UserSchema.validate({ mixed: { names: ['tom', 'xp'] } })
    assert.deepEqual(user.valid, true)
    assert.deepEqual(user.result.mixed, { names: ['tom', 'xp'] })
  })
})
