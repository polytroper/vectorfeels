function Data(spec) {
  let {
    version = '0.0.0',
    expression,
    level = {},
    levelText,
  } = spec || read()

  if (levelText) {
    try {
      level = jsyaml.load(levelText) || {}
    }
    catch (ex) {
      console.log('Could not parse level text provided to Data:\n', levelText)
    }
  }

  if (_.isNumber(level.expression))
    level.expression = level.expression.toString()

  if (!levelText) {
    levelText = jsyaml.dump(level)
  }

  function write() {
    const obj = {
      version: VERSION,
      expression,
      levelText,
      level,
    }

    const yaml = jsyaml.dump(obj)
    const compressed = LZString.compressToEncodedURIComponent(yaml)
    const url = location.origin+location.pathname+'?'+compressed

    window.history.replaceState({}, '', url)
  }

  function read() {
    const empty = {
      version: VERSION,
      expression: '',
      levelText: '',
      level: {
        expression: ''
      }
    }

    const url = window.location.href
    const arr = url.split('?')

    if (arr.length == 1) {
      console.log('No query string data! Returning empty data.')
      return empty
    }

    const compressed = arr[1]
    let decompressed

    try {
      decompressed = LZString.decompressFromEncodedURIComponent(compressed)
    }
    catch {
      console.log('Could not decompress query string! Returning empty data.')
      return empty
    }

    let obj

    try {
      obj = jsyaml.load(decompressed)
    }
    catch (ex) {
      console.log('Could not parse yaml! Returning empty data.')
      return empty
    }

    console.log('Read data from URL:', obj)

    return obj
  }

  if (_.isUndefined(level.expression))
    level.expression = ''
  else if (_.isNull(level.expression))
    level.expression = ''
  else if (_.isArray(level.expression))
    level.expression = level.expression.join('; ')

  if (!expression)
    expression = level.expression

  function toString() {
    return _.stringify({
      version,
      expression,
      level,
    })
  }

  return {
    version,
    write,
    expression,
    levelText,
    level,

    toString,

    // get expression() {return expression},
    // get levelText() {return levelText},
    // get level() {return level},
  }
}