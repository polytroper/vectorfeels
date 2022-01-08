function Data(spec) {
  let {
    version = '0.1.0',
    expressions = [null],
  } = spec || read()

  function write() {
    const obj = {
      version: VERSION,
      expressions,
    }

    const yaml = jsyaml.dump(obj)
    const compressed = LZString.compressToEncodedURIComponent(yaml)
    const url = location.origin+location.pathname+'?'+compressed

    window.history.replaceState({}, '', url)
  }

  function read() {
    const empty = {
      version: VERSION,
      expressions: [null],
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

  function toString() {
    return _.stringify({
      version,
      expressions,
    })
  }

  return {
    version,
    expressions,

    write,
    toString,
  }
}