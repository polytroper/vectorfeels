function Entity(spec, defaultName = 'Entity') {
  const self = {}
  
  let {
    name = defaultName,
    essentials = {},
    active = true,
    parent = null,
    sortOrder = 0,
    debugSelf = false,
  } = spec
  
  // Alias 'debug' to 'debugSelf'
  debugSelf = debugSelf || spec.debug || false

  // Use explicitly-passed value if defined, otherwise defer to parent
  const debugTree = spec.debugTree ||
    parent ? parent.debugTree : false
  
  if (parent) {
    parent.addChild(self)

    // Inherit parent's essentials (the items designated for inheritance by every entity below this one on the hierarchy)
    essentials = _.mixIn({}, parent.essentials, essentials)
  }
  
  // Mix the essentials into self
  _.mixIn(self, {
    self,
    base: self,
    log,
    ...essentials
  })
  
  const children = []

  let started = false
  let destroyed = false
  
  // Start is called just before the entity's first tick
  function start() {
    log(`Starting ${self.lineage}`)
    started = true

    // Unset everything that should be inaccessible after initialization 
    _.unset(self, 'start')
    _.unset(self, 'extend')
  }
  
  // Tick is called every frame at a fixed timestep
  function tick() {
    // log(`Ticking ${name}`)
  }
  
  // Draw is called every time the canvas is redrawn
  function draw() {
    // log(`Drawing ${name}`)
  }
  
  // Destroy is called when the object is to be fully removed from memory
  function destroy() {
    log(`Destroying ${self.lineage}`)
    destroyed = true

    // Unset everything that should be inaccessible after destruction 
    _.unset(self, 'destroy')

    if (parent)
      parent.removeChild(self)
  }

  function log() {
    if (debugSelf || debugTree || DEBUG)
      console.log(...arguments)
  }
  
  function sendEvent(path, args = []) {
    // Inactive entities do not process events
    if (!active) return
    
    // Must use _.get so that 'multi.part.paths' work.
    let f = _.get(self, path)
    if (_.isFunction(f))
      f.apply(self, args)
    else if (_.isArray(f)) 
      _.callEach(f, args)
    
    _.invokeEach(children, 'sendEvent', arguments)
  }
  
  function extend(extension) {
    // Push arrayed events into their arrays
    _.each(self, (array, key) => {
      const event = extension[key]

      // Is this an event array?
      if (
        _.isArray(array) &&
        _.every(array, _.isFunction) &&
        _.isFunction(event)
      ) {
        // Great, add the new event to the array and remove it from our extension object.
        array.push(event)
        _.unset(extension, key)
      }
    })

    // Mix all the new extensions into self
    _.mixIn(self, extension)

    // Copy all of self into a base object so any extending objects may access overridden methods/variables
    self.base = _.mixIn({}, self)

    return self
  }
  
  function hasChild(child) {
    return _.isInDeep(children, child)
  }
  
  function addChild(child) {
    if (hasChild(child)) return
    
    children.push(child)
  }
  
  function sortChildren() {
    children.sort(compareChildren)
  }
  
  function compareChildren(a, b) {
    a = _.isNumber(a.sortOrder) ? a.sortOrder : 0
    b = _.isNumber(b.sortOrder) ? b.sortOrder : 0
    return a-b
  }
  
  function removeChild(child) {
    _.removeDeep(children, child)
  }
  
  function setActive(_active) {
    active = _active
  }
  
  function getLineage() {
    return parent ? (parent.getLineage()+'.'+name) : name
  }
  
  function getFromAncestor(path) {
    let v = _.get(self, path, undefined)
    if (_.isUndefined(v)) {
      if (parent)
        return parent.getFromAncestor(path)
      return null
    }
    return v
  }
  
  function toString() {
    return name
  }
  
  // Mix all our new properties into self
  _.mixIn(self, {
    start: [start],

    tick: [tick],
    draw: [draw],
    
    destroy: destroy,
    
    get name() {return name},
    set name(v) {name = v},

    essentials,
    children,
    
    extend,
    sendEvent,
    
    hasChild,
    addChild,
    removeChild,
    
    getFromAncestor,
    getLineage,
    
    get lineage() {return getLineage()},
    
    get parent() {return parent},
    get root() {return parent ? parent.root : self},
    
    get active() {return active},
    set active(v) {setActive(v)},

    get started() {return started},
    get destroyed() {return destroyed},
    
    get sortOrder() {return sortOrder},
    set sortOrder(v) {sortOrder = v},
    
    get debug() {return debugSelf || debugTree},
    get debugSelf() {return debugSelf},
    get debugTree() {return debugTree || parent ? parent.debugTree : false},

    toString,
  })

  // Return an object containing all of self, plus anything included in the spec. This allows Entities to destructure spec and self in a single statement.
  return _.mixIn({}, spec, self)
}