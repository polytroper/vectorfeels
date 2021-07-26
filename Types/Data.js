function Data(spec) {
  let {
    expression = '',
    levelText = '',
  } = spec || read()

  let level = {}

  try {
    level = jsyaml.load(levelText) || {}
  }
  catch (ex) {
    console.log('Could not parse level text provided to Data:\n', levelText)
  }

  if (_.isNumber(level.expression))
    level.expression = level.expression.toString()

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

  return {
    write,
    expression,
    levelText,
    level,
    // get expression() {return expression},
    // get levelText() {return levelText},
    // get level() {return level},
  }
}