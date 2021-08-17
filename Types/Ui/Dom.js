function Dom(spec, defaultName = 'dom') {
  const self = {}
  
  let {
    name = defaultName,
    parent = null,
    debugSelf = false,
  } = spec

  let dirty = true

  function parse(str) {
    return new DOMParser().parseFromString(str, "text/html")
  }

  function extend(extension) {
    // Mix all the new extensions into self
    _.mixIn(self, extension)

    // Copy all of self into a base object so any extending objects may access overridden methods/variables
    self.base = _.mixIn({}, self)

    return self
  }

  function render() {
    return `<div></div>`
  }

  return _.mixIn(self, {
    name,
    parent,

    parse,
    extend,

    render,
  })
}