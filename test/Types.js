const AJS = require('..')
const { deepEqual } = require('./_util')

const UserSchema = AJS('User', {
  uid: { type: AJS.Types.ObjectId },
  string: { type: AJS.Types.String },
  number: { type: AJS.Types.Number },
  integer: { type: AJS.Types.Integer },
  double: { type: AJS.Types.Double },
  date: { type: AJS.Types.Date },
  buffer: { type: AJS.Types.Buffer },
  boolean: { type: AJS.Types.Boolean },
  mixed: { type: AJS.Types.Mixed }
})

describe('Types', function () {
  it('ObjectId', function () {
    let user = UserSchema.validate({ uid: 'xxx' })
    deepEqual(user.valid, false)

    user = UserSchema.validate({ uid: '111111111111111111111111' })
    deepEqual(user.valid, true)
    deepEqual(user.result.uid.toString(), '111111111111111111111111')
  })

  it('String', function () {
    let user = UserSchema.validate({ string: 111 })
    deepEqual(user.valid, true)
    deepEqual(user.result.string, '111')
  })

  it('Number', function () {
    let user = UserSchema.validate({ number: 1.2 })
    deepEqual(user.valid, true)
    deepEqual(user.result.number, 1.2)

    user = UserSchema.validate({ number: 'haha' })
    deepEqual(user.valid, false)
  })

  it('Integer', function () {
    let user = UserSchema.validate({ integer: 1.2 })
    deepEqual(user.valid, true)
    deepEqual(user.result.integer, 1)

    user = UserSchema.validate({ integer: 'haha' })
    deepEqual(user.valid, false)
  })

  it('Double', function () {
    let user = UserSchema.validate({ double: 1.2 })
    deepEqual(user.valid, true)
    deepEqual(user.result.double, 1.2)

    user = UserSchema.validate({ double: 'haha' })
    deepEqual(user.valid, false)
  })

  it('Date', function () {
    let user = UserSchema.validate({ date: '2018-04-13' })
    deepEqual(user.valid, true)
    deepEqual(typeof user.result.date, 'object')
    deepEqual(user.result.date, new Date('2018-04-13'))

    user = UserSchema.validate({ date: 'haha' })
    deepEqual(user.valid, false)
  })

  it('Buffer', function () {
    let user = UserSchema.validate({ buffer: '123' })
    deepEqual(user.valid, true)
    deepEqual(Buffer.isBuffer(user.result.buffer), true)
    deepEqual(user.result.buffer.toString(), '123')

    user = UserSchema.validate({ buffer: Buffer.from('123') })
    deepEqual(user.valid, true)
    deepEqual(Buffer.isBuffer(user.result.buffer), true)
    deepEqual(user.result.buffer.toString(), '123')

    user = UserSchema.validate({ buffer: 1 })
    deepEqual(user.valid, false)
  })

  it('Boolean', function () {
    let user = UserSchema.validate({ boolean: 1 })
    deepEqual(user.valid, true)
    deepEqual(user.result.boolean, true)
  })

  it('Mixed', function () {
    let user = UserSchema.validate({ mixed: { names: ['tom', 'xp'] } })
    deepEqual(user.valid, true)
    deepEqual(user.result.mixed, { names: ['tom', 'xp'] })
  })
})
