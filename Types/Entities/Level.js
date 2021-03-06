function Level(spec) {
  const {
    self,
    log,
    ui,
    screen,
    engine,
    field,
    globalScope,
    levelCompleted,
    data,
  } = Entity(spec, 'Level')

  console.log('Booting level with data:', data)

  let completed = false
  let lowestOrder = 'Z'

  const goalInclusions = {
    goalCompleted,
    goalFailed,
    refreshLowestOrder,
    getLowestOrder: () => lowestOrder,
    getCollectors: () => elements.Collector.instances,
  }

  const elements = {
    Collector: {
      inclusions: {},
    },
    FixedGoal: {
      inclusions: {
        ...goalInclusions,
      }
    },
    FreeGoal: {
      inclusions: {
        ...goalInclusions,
      }
    },
    PathGoal: {
      inclusions: {
        ...goalInclusions,
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
    ...elements.FixedGoal.instances,
    ...elements.PathGoal.instances,
    ...elements.FreeGoal.instances,
  ]

  function start() {
    console.log('Starting Level')
    refreshLowestOrder()
  }

  function tick() {

  }
  
  function draw() {

  }

  function loadElement(datum, key) {
    const e = elements[key]
    console.log('Loading element ', key)

    // Pull element's Entity constructor from window
    const instance = window[key]({
      parent: self,
      ...datum,
      ...e.inclusions,
      debug: true,
    })

    e.instances.push(instance)
  }

  function goalCompleted(goal) {
    log('Goal completed!')

    if (!completed) {
      
      refreshLowestOrder()
      
      for (goal of goals) {
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
      for (g of goals) {
        if (g.order && !g.completed)
          g.fail()
      }
    }
  }
  
  function refreshLowestOrder() {
    lowestOrder = 'Z'
    for (goal of goals) {
      if (!goal.completed && goal.order < lowestOrder) {
        lowestOrder = goal.order
      }
    }

    console.log('Refreshing lowest order: ', lowestOrder)
    
    _.invokeEach(goals, 'refresh')
  }

  function reset() {
    refreshLowestOrder()
  }

  function stopRunning() {
    _.invokeEach(goals, 'reset')
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
  })
}