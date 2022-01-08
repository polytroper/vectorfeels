function Engine(spec) {
  const self = {}
  
  const {
    data,
    canvas,
    ticksPerSecond = 60,
    stepping = false,
    embedded = false,
  } = spec
  
  console.log(`Engine starting up!`)
  
  let canvasIsDirty = true

  const tickDelta = 1/ticksPerSecond
  let time = 0

  _.mixIn(self, {
    get embedded() {return embedded},
    
    get time() {return time},
    get tickDelta() {return tickDelta},

    requestDraw,
    raiseMessage,
  })

  const screen = Screen({
    canvas
  })
  
  const world = World({
    essentials: {
      screen,
      tickDelta,
      engine: self,
    },
    data,
    debug: true,
  })

  _.mixIn(self, {
    world,
  })

  resize()
  tick()
  draw()
  
  if (!stepping) {
    setInterval(tick, 1000/ticksPerSecond)
  }
  
  // Core methods
  
  function tick() {
    if (window.innerHeight != screen.height || window.innerWidth != screen.width)
      resize()
      
    world.sendEvent('start')
    world.sendEvent('tick')
    
    time += tickDelta
  
    requestDraw()
  }
  
  function draw() {
    //console.log(`Drawing!`)
    
    if (!canvasIsDirty) return
    canvasIsDirty = false
    
    world.sendEvent('draw')
  }
  
  function requestDraw() {
    if (!canvasIsDirty) {
      canvasIsDirty = true
      requestAnimationFrame(draw)
    }
  }
  
  function resize() {
    screen.resize()
    world.sendEvent('resize')
    canvasIsDirty = true
    draw()
  }

  function raiseMessage(channel, obj={}) {
    if (embedded) {
      window.parent.postMessage({
        channel,
        ...obj
      }, '*')
    }
  }
  
  // HTML events

  function onKeyUp(event) {
    
  }
  
  window.addEventListener('keyup', onKeyUp)
  
  function onResizeWindow(event) {
    resize()
  }
  
  window.addEventListener('resize', onResizeWindow)
  
  function onClickCanvas() {
    if (stepping) {
      tick()
    }
  }
  
  canvas.addEventListener('click', onClickCanvas)
  
  return self
}