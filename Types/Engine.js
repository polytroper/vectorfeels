function Engine(spec) {
  const self = {}
  
  const {
    canvas,
    ticksPerSecond = 60,
    stepping = false,
  } = spec
  
  console.log(`Engine starting up!`)
  
  let canvasIsDirty = true

  const tickDelta = 1/ticksPerSecond
  let time = 0

  const screen = Screen({
    canvas
  })
  
  const ui = Ui({
    screen,
    canvas,
    engine: self,
  })
  
  const world = World({
    ui,
    screen,
    tickDelta,
    engine: self,
    getTime: () => time,
  })

  _.mixIn(self, {
    ui,
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
      
    world.sendLifecycleEvent('awake')
    world.sendLifecycleEvent('start')
    
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