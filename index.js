'use strict';

var isBuffer = require('is-buffer');
var helpersFuncs = require('./helpers');

function AJS(name, schema) {
  if (!(this instanceof AJS)) {
    return new AJS(name, schema);
  }

  if (name) {
    this.compile(name, schema);
  }
}

var helpers = {};

AJS.register = function register(name, fn) {
  if (!name || !fn) throw new TypeError('Missing name or fn');
  helpers[name] = fn;
};

AJS.prototype.compile = function compile(name, schema) {
  if (!schema) {
    schema = name;
  } else {
    this._name = name;
  }
  if ('object' !== typeof schema) throw new TypeError('Schema must be object or array');

  this._children = _compileSchema(schema, this);

  _iteratorSchema(this);
  return this;
};

AJS.prototype.validate = function validate(obj, opts) {
  if (!this._schema) throw new TypeError('No schema assigned, please call .compile(schema)');
  opts = opts || {};
  return _validateObject(obj, opts, this);
};

function _compileSchema(schema, ctx) {
  var children = {};
  var isArray = Array.isArray(schema);
  schema = isArray ? schema[0] : schema;
  ctx[isArray ? '_array' : '_object'] = true;

  if (schema instanceof AJS) {
    if (schema._name) ctx._name = schema._name;
    if (schema._leaf) {
      ctx._leaf = schema._leaf;
      delete ctx._object;
    }
    // consider [JAS(...)] & AJS([...])
    if (schema._array) {
      ctx._array = schema._array;
      delete ctx._object;
    }
    return schema._children;
  }

  // check whether the leaf node
  if (schema.type && !(schema.type instanceof AJS) && !schema.type.type) {
    ctx._leaf = true;
    // leaf should not be object
    delete ctx._object;
    return schema;
  }

  for (var key in schema) {
    children[key] = AJS(schema[key]);
  }

  return children;
}

function _iteratorSchema(ctx, parentKey, currentKey, parentNode) {
  ctx._name = ctx._name || (parentNode && parentNode._name);
  if (!ctx._name) delete ctx._name;
  ctx._parent = parentNode || null;
  ctx._path = !parentKey ? '$' : (parentKey + '.' + currentKey);
  if (ctx._array) {
    ctx._path = ctx._path + '[]';
  }

  if (ctx._leaf) {
    ctx._schema = ctx._array ? [ctx._children] : ctx._children;
  } else if (ctx._array) {
    ctx._schema = [iterator(ctx._children)];
  } else {
    ctx._schema = iterator(ctx._children);
  }
  return ctx._schema;

  function iterator(children) {
    var result = {};
    for (var key in children) {
      result[key] = _iteratorSchema(children[key], ctx._path, key, ctx);
    }
    return result;
  }
}

function _validateObject(obj, opts, ctx) {
  var additionalProperties = opts.additionalProperties;
  var error = null;

  iterator(obj, opts, ctx);
  function iterator(children, opts, ctx, currentKey, parentNode) {
    if (error) return;
    var isObject = 'object' === typeof children;
    var isArray = Array.isArray(children);
    parentNode = parentNode || {};

    error = validateType(children, ctx);
    if (error) return;
    
    if (ctx._leaf || isBuffer(children) || !isObject) {
      error = validateLeaf(children, opts, ctx, currentKey, parentNode);
    } else {
      if (isArray) {
        children.forEach(function (item, index) {
          iterator(item, opts, ctx, index, children);
        });
      } else {
        for (var key in children) {
          if (!ctx._children || !ctx._children[key]) {
            if (!additionalProperties) {
              delete children[key];
            }
          } else {
            iterator(children[key], opts, ctx._children[key], key, children);
          }
        }
      }
    }
  }

  return {
    valid: !error,
    error: error,
    result: obj
  };
}

function validateType(value, ctx) {
  var isObject = 'object' === typeof value;
  var isArray = Array.isArray(value);
  var error = null;

  if (ctx._leaf) {
    if (ctx._parent) {
      if (isArray && !ctx._array) {
        error = genError(value, ctx);
      } else if (ctx._array && !isArray) {
        error = genError(value, ctx, false, 'array');
      }
    }
  } else {
    if (ctx._object && !isObject) {
      error = genError(value, ctx, false, 'object');
    }
  }

  return error;
}

function validateLeaf(value, opts, ctx, currentKey, parentNode) {
  var valid = true;
  var error = null;
  // leaf also is array
  if (Array.isArray(value)) {
    for (var index in value) {
      if (!valid) break;
      valid = validate(value[index], index, value);
    }
  } else {
    validate(value, currentKey, parentNode);
  }
  
  function validate(value, currentKey, parentNode) {
    var valid = helpers.type.call(ctx, value, ctx._children.type, currentKey, parentNode);
    if (!valid) {
      error = genError(value, ctx, 'type');
      return valid;
    }

    for (var helper in ctx._children) {
      if (!valid || 'type' === helper || !helpers[helper] || (opts[helper] !== undefined && !opts[helper])) {
        continue;
      }
      valid = helpers[helper].call(ctx, value, ctx._children[helper], currentKey, parentNode);
      if (!valid) {
        error = genError(value, ctx, helper);
        return valid;
      }
    }
    return valid;
  }

  return error;
}

function genError(value, ctx, helper, type) {
  var error = null;
  if (!type) {
    if (helper) {
      var helperEntry = ctx._children[helper];
      if ('function' === typeof helperEntry) {
        error = new Error('(' + ctx._path + ': ' + JSON.stringify(value) + ') ✖ (' + helper + ': ' + (helperEntry.name || 'Function') + ')');
      } else {
        error = new Error('(' + ctx._path + ': ' + JSON.stringify(value) + ') ✖ (' + helper + ': ' + helperEntry + ')');
      }
      error.validator = helper;
    } else {
      error = new Error('(' + ctx._path + ': ' + JSON.stringify(value) + ') ✖ (' + JSON.stringify(ctx._children) + ')');
      error.validator = 'type';
    }
  } else {
    error = new Error('(' + ctx._path + ': ' + JSON.stringify(value) + ') ✖ (type: ' + type + ')');
    error.validator = 'type';
  }
  
  error.actual = value;
  error.expected = ctx._children;
  error.path = ctx._path;
  error.schema = ctx._name;
  return error;
}

module.exports = AJS;
module.exports.helpers = helpersFuncs;

Object.keys(helpersFuncs).forEach(function (helper) {
  AJS.register(helper, helpersFuncs[helper]);
});
