// Extensions to external libraries that I need for my own sick, twisted purposes

// lodash

_.tryInvoke = function(object, path, ...args) {
  let f = _.get(object, path)
  if (_.isFunction(f)) {
    return f.apply(object, args)
  }
  return null
}

_.callEach = function(array, args) {
  for (let i = 0; i < array.length; i++) {
    if (_.isFunction(array[i])) {
      array[i].apply(null, args)
    }
    else if (_.isArray(array[i])) {
      _.callEach(array[i], args)
    }
  }
}

_.invokeEach = function(array, path, args) {
  for (let i = 0; i < array.length; i++) {
    let v = array[i]
    
    if (_.isArray(v)) {
      _.invokeEach(v, path, args)
    }
    else {
      let f = _.get(v, path)
      
      if (_.isFunction(f))
        f.apply(v, args)
    }
  }
}

_.eachDeep = function(array, callback, args = []) {
  for (let i = 0; i < array.length; i++) {
    let v = array[i]
    
    if (_.isArray(v))
      _.eachDeep(v, callback, args)
    else
      callback.apply(null, [v, i, array, ...args])
  }
}

_.eachDeepObject = function(object, callback, args = []) {
  _.each(object, (v, k) => {
    if (_.isObject(v))
      _.eachDeepObject(v, callback, args)
    else
      callback.apply(null, [v, k, object, ...args])
  })
}

_.eachDeepOnObject = function(object, callback, args = []) {
  callback.apply(null, [object, ...args])
  _.each(object, (v, k) => {
    if (_.isObject(v)) {
      _.eachDeepOnObject(v, callback, args)
    }
  })
}

_.isInDeep = function(array, object) {
  for (let i = 0; i < array.length; i++) {
    let v = array[i]
    
    if (object === v)
      return true
    else if (_.isArray(v)) {
      if (_.isInDeep(v, object))
        return true
    }
  }
  
  return false
}

_.removeDeep = function(array, object) {
  for (let i = 0; i < array.length; i++) {
    let v = array[i]
    
    if (v == object) {
      array.splice(i, 1)
      return
    }
    else if (_.isArray(v))
      _.removeDeep(v, object)
  }
}

_.mix = function(...sources) {
  const result = {}
  for (const source of sources) {
    const props = Object.keys(source)
    for (const prop of props) {
      const descriptor = Object.getOwnPropertyDescriptor(source, prop)
      Object.defineProperty(result, prop, descriptor)
    }
  }
  return result
}

_.mixIn = function(...sources) {
  const result = sources[0]
  for (let i = 1; i < sources.length; i++) {
    let source = sources[i]
    const props = Object.keys(source)
    for (const prop of props) {
      const descriptor = Object.getOwnPropertyDescriptor(source, prop)
      Object.defineProperty(result, prop, descriptor)
    }
  }
  return result
}

_.stringify = function stringify(obj_from_json, tabs=1) {
    let spaces = ''
    let spacesMinusOne = ''

    for (let i = 0; i < tabs; i++)
      spaces += '&nbsp&nbsp'
    for (let i = 0; i < tabs-1; i++)
      spacesMinusOne += '&nbsp&nbsp'

    if (_.isArray(obj_from_json)){
      let props = obj_from_json.map(v =>
        `${_.stringify(v, tabs)}`)
          .join(', ')
      return `[${props}]`
    }
    else if (_.isString(obj_from_json)) {
      return `'${obj_from_json.replaceAll('\\', '\\\\')}'`
    }
    else if (_.isObject(obj_from_json)){
      let props = Object
          .keys(obj_from_json)
          .map(key => `${spaces}${key}: ${_.stringify(obj_from_json[key], tabs+1)}`)
          .join(',\n')
      return `{\n${props}\n${spacesMinusOne}}`
    }
    else {
      return JSON.stringify(obj_from_json);
    }
    // Implements recursive object serialization according to JSON spec
    // but without quotes around the keys.
}

_.isAccessor = (object, property) => {
  const o = Object.getOwnPropertyDescriptor(object, property)

  if (!_.isObject(o))
    return false
  
  return !('value' in o)
}

_.isVector2 = v => {
  return _.isAccessor(v, 'x') && _.isAccessor(v, 'y')
}

// math.js

math.clamp = function(a, b, t) {
  return Math.max(a, Math.min(t, b))
}

math.clamp01 = function(t) {
  return Math.max(0, Math.min(t, 1))
}

math.lerp = function(a, b, t, smooth=false) {
  if (smooth)
    t = math.smooth(t)
    
  return a+(b-a)*t
}

math.modLerp = function(a, b, t, mod=TAU, smooth=false) {
  while (a < 0) a += mod
  while (a > mod) a -= mod
  
  while (b < 0) b += mod
  while (b > mod) b -= mod
  
  if (Math.abs(a-b) > mod/2) {
    if (a < b) a += mod
    else b += mod
  }
  
  let c = math.lerp(a, b, t, smooth)
  
  while (c < 0) c += mod
  while (c > mod) c -= mod

  return c
}

math.unlerp = function(a, b, c) {
  return (c-a)/(b-a)
}

math.truncate = function(number, digits) {
  const c = Math.pow(10, digits)
  return Math.floor(number*c)/c
}

math.smooth = function(t) {
  t *= Math.PI
  return 1-(Math.cos(t)+1)/2
}

math.toTex = function(text) {
  if (!text)
    return ''
    
  let latex = math.parse(text).toTex({
    parenthesis: 'auto',
    handler: (node, options) => {
    }
  })

  if (latex == 'undefined')
    return ''

  latex = latex.replaceAll(';\\;\\;', ';\\ ')
  latex = latex.replaceAll(':=', '=')
  latex = latex.split('~').join('')

  return latex
}

math.isComplex = function(v) {
  if (!_.isObject(v))
    return false
  return v.__proto__.type == 'Complex'
}

math.isNumerical = function(v) {
  return math.isComplex(v) || _.isNumber(v)
}

math.makeNumerical = (() => {
  // Return the right kind of zero based on output type
  const returnZero = output => {
    if (math.isComplex(output)) {
      output.re = 0
      output.im = 0
      return output
    }
    
    if (_.isVector2(output)) {
      output.x = 0
      output.y = 0
      return output
    }
    
    return 0
  }
  
  return function(v, output) {
    if (_.isUndefined(v) || _.isNull(v))
      return returnZero(output)
  
    if (v.__proto__.type == 'ResultSet')
      v = _.last(v.valueOf())
    
    if (math.isComplex(v)) {
      if (!output)
        return v
      if (math.isComplex(output)) {
        output.re = v.re
        output.im = v.im
        return output
      }
      if (_.isVector2(output)) {
        output.x = v.re
        output.y = v.im
        return output
      }
      throw '_.makeNumerical output is not a valid output object!'
    }

    if (_.isNumber(v)) {
      if (!output)
        return v
      if (math.isComplex(output)) {
        output.re = v
        output.im = 0
        return output
      }
      if (_.isVector2(output)) {
        output.x = v
        output.y = 0
        return output
      }
      throw '_.makeNumerical output is not a valid output object!'
    }
    
    // Seems redundant, but this check must be performed twice in case the final element of the ResultSet is undefined
    if (_.isUndefined(v) || _.isNull(v))
      return returnZero(output)
    
    // Return 0 if v is a plain JS object
    if (_.isObject(v) && _.isUndefined(v.__proto__.type))
      return returnZero(output)
    
    if (v.units || v.signatures)
      return returnZero(output)
  
    // If v is a matrix, convert it to a complex number by treating it as a 2-vector
    if (v.__proto__.type == 'DenseMatrix') {
      let a = v._data
  
      let ax = 0
      let ay = 0
  
      if (a.length > 0)
        ax = a[0]
      if (a.length > 1)
        ay = a[1]

      if (!output)
        return math.complex(0, 0)
      if (math.isComplex(output)) {
        output.re = ax
        output.im = ay
        return output
      }
      if (_.isVector2(output)) {
        output.x = ax
        output.y = ay
        return output
      }
      throw '_.makeNumerical output is not a valid output object!'
    }

    console.error('Unable to coerce value to numerical:', v.__proto__.type, v)
    return v
  }
})()

math.pinf = Number.POSITIVE_INFINITY
math.ninf = Number.NEGATIVE_INFINITY

// Constants

PINF = Number.POSITIVE_INFINITY
NINF = Number.NEGATIVE_INFINITY
PI = Math.PI
TAU = PI*2

const alphabetUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const alphabetLower = 'abcdefghijklmnopqrstuvwxyz'

// "The poor man's jquery" —Nicky Case
const $ = document.querySelector.bind(document)