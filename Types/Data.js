function Data(spec) {
  let {
    version = VERSION,
    latex = {
      build: [null],
      edit: [null],
    },
  } = spec || read()

  function write() {
    const obj = {
      version: VERSION,
      latex,
    }

    const yaml = jsyaml.dump(obj)
    const compressed = LZString.compressToEncodedURIComponent(yaml)
    const url = location.origin+location.pathname+'?'+compressed

    window.history.replaceState({}, '', url)
  }

  function read() {
    const empty = {
      version: VERSION,
      latex: {
        build: [null],
        edit: [null],
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

    if (obj.version != VERSION) {
      const originalVersion = obj.version
      obj = UPGRADE_DATA(obj)
      console.log(`URL data is versioned ${originalVersion}. Upgraded to ${obj.version}:`, obj)
    }

    return obj
  }

  function toString() {
    return _.stringify({
      version,
      latex,
    })
  }

  return {
    version,
    latex,

    write,
    toString,
  }
}

function UPGRADE_DATA(obj) {
  function matchVersion(a, b) {
    a = a.split('.')
    b = b.split('.')

    while (a.length > 0 && b.length > 0) {
      if (a.shift() != b.shift())
        return false
    }

    return true
  }

  let upgrader
  while (upgrader = _.find(UPGRADES, (v, k) => matchVersion(obj.version, k))) {
    obj = upgrader(obj)
  }

  return obj
}

// If you are adding stuff here, ask yourself: do I need to change the version number in main.js? Don't forget to do that!
const UPGRADES = {
  '0.0': obj => {
    console.log('Upgrading from 0.0.* to 0.1.0…')
    const expressions = [null, obj.expression]

    try {
      const level = jsyaml.load(obj.levelText)
      console.log('Adapting 0.0.* level:', level)

      function extractType(type) {
        if (level[type]) {
          const arr = _.isArray(level[type]) ? level[type] : [level[type]]

          for (g of arr) {
            let str = 'type: \''+type+'\''

            if (_.has(g, 'x') || _.has(g, 'y')) {
              str += ', p: '+math.complex(g.x || 0, g.y || 0).toString()
            }

            str = '\\left\\{'+str+'\\right\\}'
            expressions.unshift(str)
          }
        }
      }

      extractType('Collector')
      extractType('FixedGoal')
      extractType('FreeGoal')
    }
    catch (ex) {
      console.log('Error when parsing YAML for a v0.0.* level specification: ', ex)
      console.log(obj.levelText)
    }

    return {
      version: '0.1.0',
      expressions,
    }
  },
  '0.1': obj => {
    console.log('Upgrading from 0.1.* to 0.2.0…')

    return {
      version: '0.2.0',
      latex: {
        build: [...obj.expressions],
        edit: [...obj.expressions],
      }
    }
  },
}