function Level(spec) {
  const {
    self,
    log,
    ui,
    screen,
    engine,
    field,
    levelCompleted,
    data,
  } = Entity(spec, 'Level')

  let completed = false
  let lowestOrder = 'Z'

  const instances = {}

  // A default spec to spawn a goal with
  const goalInclusions = {
    goalCompleted,
    goalFailed,
    refreshLowestOrder,
    getLowestOrder: () => lowestOrder,
    getCollectors: () => elements.Collector.instances,
  }

  const aliases = {
    position: ['p'],
    rotation: ['r'],
    type: ['o'],
  }

  const goalAliases = {
    ...aliases,
  }

  const elements = {
    Collector: {
      inclusions: {},
      aliases: {
        ...aliases,
      }
    },
    FixedGoal: {
      inclusions: {
        ...goalInclusions,
      },
      aliases: {
        ...goalAliases,
      }
    },
    FreeGoal: {
      inclusions: {
        ...goalInclusions,
      },
      aliases: {
        ...goalAliases,
      }
    },
    PathGoal: {
      inclusions: {
        ...goalInclusions,
      },
      aliases: {
        ...goalAliases,
      }
    }
  }

  _.each(elements, (v, k) => {
    v.instances = []
    const d = data[k]
    
    if (_.isArray(d))
      _.each(d, d => loadElement(d, k))
    else if (_.isObject(d))
      loadElement(d, k)
  })

  const goals = [
    elements.FixedGoal.instances,
    elements.PathGoal.instances,
    elements.FreeGoal.instances,
  ]

  function start() {
    refreshLowestOrder()
  }

  function tick() {

  }
  
  function draw() {

  }

  function numericalize(o) {
    _.each(o, (v, k) => {
      if (math.isNumerical(v))
        o[k] = math.makeNumerical(v, Vector2())
      else if (_.isObject(v))
        numericalize(o)
    })
  }
// \left\{type:'FixedGoal',p:4+i\right\}
  function spawn(elementSpec) {
    console.log('Spawning element: ', elementSpec)

    let s = _.cloneDeep(elementSpec)
    numericalize(s)

    const key = s.type
    const e = elements[key]

    _.each(aliases, (v, k) => {
      for (alias of v) {
        if (s[alias]) {
          console.log('Reassigning ', alias, k)
          s[k] = s[alias]
        }
      }
    })

    s = {
      ...s,
      ...e.inclusions,
      parent: self,
      debug: true,
    }


    // Pull element's Entity constructor from window
    const instance = window[key](s)

    e.instances.push(instance)

    instances[elementSpec] = instance

    _.invokeEach(_.flatten(goals), 'refreshColors')

    return instance
  }

  function mutate(elementSpec, _elementSpec) {
    const instance = instances[_elementSpec]
    console.log('Mutating element: ', elementSpec, _elementSpec)
  }

  function despawn(elementSpec) {
    console.log('Despawning element: ', elementSpec)
  }

  function goalCompleted(goal) {
    log('Goal completed!')

    if (!completed) {
      
      refreshLowestOrder()
      
      for (goal of _.flatten(goals)) {
        if (!goal.completed) {
          return
        }
      }
      
      completed = true
      levelCompleted()
    }
  }
  
  function goalFailed(goal) {
    console.log('Failed :(')
    
    if (goal.order) {
      for (g of _.flatten(goals)) {
        if (g.order && !g.completed)
          g.fail()
      }
    }
  }
  
  function refreshLowestOrder() {
    lowestOrder = 'Z'
    for (goal of _.flatten(goals)) {
      if (!goal.completed && goal.order < lowestOrder) {
        lowestOrder = goal.order
      }
    }

    // console.log('Refreshing lowest order: ', lowestOrder)
    
    _.invokeEach(_.flatten(goals), 'refresh')
  }

  function reset() {
    refreshLowestOrder()
  }

  function stopRunning() {
    _.invokeEach(_.flatten(goals), 'reset')
    completed = false
    reset()
  }
  
  return self.extend({
    start,
    
    tick,
    draw,
    
    reset,

    stopRunning,

    get completed() {return completed},

    spawn,
    mutate,
    despawn,
  })
}