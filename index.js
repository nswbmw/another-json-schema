const helpersFuncs = require('./helpers')

function AJS (name, schema) {
  if (!(this instanceof AJS)) {
    return new AJS(name, schema)
  }

  if (name) {
    this.compile(name, schema)
  }
}

AJS.register = function register (name, fn) {
  if (!name || !fn) throw new TypeError('Missing name or fn')
  helpersFuncs[name] = fn
}

AJS.prototype.compile = function compile (name, schema) {
  if (!schema) {
    schema = name
  } else {
    this._name = name
  }
  if (typeof schema !== 'object') {
    throw new TypeError(`Schema must be object or array, but got ${JSON.stringify(schema)}, maybe missing 'type' validator.`)
  }

  this._children = _compileSchema(schema, this)
  _iteratorSchema(this)

  return this
}

AJS.prototype.validate = function validate (obj, opts) {
  if (!this._schema) throw new TypeError('No schema assigned, please call .compile(schema)')
  opts = opts || {}
  return _validateObject(obj, opts, this)
}

function _compileSchema (schema, ctx) {
  const children = {}
  const isArray = Array.isArray(schema)
  schema = isArray ? schema[0] : schema
  ctx[isArray ? '_array' : '_object'] = true

  if (schema instanceof AJS) {
    if (schema._name) ctx._name = schema._name
    if (schema._leaf) {
      ctx._leaf = schema._leaf
      delete ctx._object
    }
    // consider [AJS(...)] & AJS([...])
    if (schema._array) {
      ctx._array = schema._array
      delete ctx._object
    }
    return schema._children
  }

  // check whether the leaf node
  if (schema.type && !(schema.type instanceof AJS) && !schema.type.type) {
    ctx._leaf = true
    // leaf should not be object
    delete ctx._object
    return schema
  }
  for (let key in schema) {
    children[key] = AJS(schema[key])
  }

  return children
}

function _iteratorSchema (ctx, parentKey, currentKey, parentNode) {
  ctx._name = ctx._name || (parentNode && parentNode._name)
  if (!ctx._name) delete ctx._name
  ctx._parent = parentNode || null
  ctx._path = !parentKey ? '$' : (parentKey + '.' + currentKey)
  if (ctx._array) {
    ctx._path = ctx._path + '[]'
  }

  if (ctx._leaf) {
    ctx._schema = ctx._array ? [ctx._children] : ctx._children
  } else if (ctx._array) {
    ctx._schema = [iterator(ctx._children)]
  } else {
    ctx._schema = iterator(ctx._children)
  }
  return ctx._schema

  function iterator (children) {
    const result = {}
    for (let key in children) {
      result[key] = _iteratorSchema(children[key], ctx._path, key, ctx)
    }
    return result
  }
}

function _validateObject (obj, opts, ctx) {
  const additionalProperties = opts.additionalProperties
  let error = null

  try {
    iterator(obj, null, obj, opts, ctx)
  } catch (e) {
    error = e
  }
  function iterator (parent, key, children, opts, ctx) {
    const isObject = typeof children === 'object'
    const isArray = Array.isArray(children)

    if (!opts.ignoreNodeType) {
      validateType(children, ctx)
    }

    if (ctx._leaf || !isObject) {
      validateLeaf(parent, key, children, opts, ctx)
    } else {
      if (isArray) {
        children.forEach(function (item, index) {
          return iterator(children, index, item, opts, ctx)
        })
      } else {
        // if not allow additionalProperties, delete those properties
        if (!additionalProperties) {
          for (let key in children) {
            if (!(key in ctx._children)) {
              delete children[key]
            }
          }
        }
        for (let key in ctx._children) {
          iterator(children, key, children[key], opts, ctx._children[key])
        }
      }
    }
  }

  return {
    valid: !error,
    error: error,
    result: obj
  }
}

function validateType (value, ctx) {
  const isObject = typeof value === 'object'
  const isArray = Array.isArray(value)

  if (ctx._leaf) {
    if (typeof ctx._children.type === 'function') {
      return
    }
    if (isArray && !ctx._array) {
      throwError(value, ctx)
    } else if (ctx._array && !isArray) {
      throwError(value, ctx, null, 'array')
    }
  } else {
    if (ctx._object && !isObject) {
      throwError(value, ctx, null, 'object')
    }
  }
}

function validateLeaf (parent, key, value, opts, ctx) {
  // leaf also is array
  if (Array.isArray(value)) {
    return value.map(function (item, index) {
      return validate(item, index, value)
    })
  } else {
    return validate(value, key, parent)
  }

  function validate (value, key, parent) {
    let valid = true// default passed
    // first, check default
    if ('default' in ctx._children) {
      if (opts.default == null || opts.default) {
        helpersFuncs.default.call(ctx, value, ctx._children.default, key, parent)
        // rewrite value
        value = parent[key]
      }
    }

    // second, check required
    if (ctx._children.required) {
      if (opts.required == null || opts.required) {
        valid = helpersFuncs.required.call(ctx, value, ctx._children.required, key, parent)
        if (!valid) {
          throwError(value, ctx, 'required')
        }
      }
    }

    // null will return, not check type & other validators
    if (value == null) {
      return value
    }

    // then check type
    try {
      valid = helpersFuncs.type.call(ctx, value, ctx._children.type, key, parent)
    } catch (e) {
      throwError(value, ctx, 'type', null, e)
    }
    if (!valid) {
      throwError(value, ctx, 'type')
    }

    // then check others
    for (let helper in ctx._children) {
      if (['type', 'default', 'required'].indexOf(helper) !== -1 || (opts[helper] != null && !opts[helper])) {
        continue
      }
      try {
        /* istanbul ignore else */
        if (typeof ctx._children[helper] === 'function') {
          // custom function validator
          valid = ctx._children[helper].call(ctx, value, ctx._children[helper], key, parent)
        } else if (helpersFuncs[helper]) {
          // registered helpers
          valid = helpersFuncs[helper].call(ctx, value, ctx._children[helper], key, parent)
        }
      } catch (e) {
        throwError(value, ctx, helper, null, e)
      }
      if (!valid) {
        throwError(value, ctx, helper)
      }
    }
    return value
  }
}

function throwError (value, ctx, helper, type, originError) {
  let error
  if (!type) {
    if (helper) {
      const helperEntry = ctx._children[helper]
      if (typeof helperEntry === 'function') {
        error = new TypeError('(' + ctx._path + ': ' + JSON.stringify(value) + ') ✖ (' + helper + ': ' + helperEntry.name + ')')
      } else {
        error = new TypeError('(' + ctx._path + ': ' + JSON.stringify(value) + ') ✖ (' + helper + ': ' + helperEntry + ')')
      }
      error.validator = helper
    } else {
      error = new TypeError('(' + ctx._path + ': ' + JSON.stringify(value) + ') ✖ (' + JSON.stringify(ctx._children) + ')')
      error.validator = 'type'
    }
  } else {
    error = new TypeError('(' + ctx._path + ': ' + JSON.stringify(value) + ') ✖ (type: ' + type + ')')
    error.validator = 'type'
  }

  error.path = ctx._path
  error.actual = value
  error.expected = ctx._schema
  error.schema = ctx._name

  if (originError) {
    error.originError = originError
  }
  throw error
}

module.exports = AJS
module.exports.helpers = helpersFuncs
