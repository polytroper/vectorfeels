function World(spec) {
  const self = Entity(spec, 'World')
  
  const {
    ui,
    screen,
    requestDraw,
    tickDelta,
  } = spec

  let running = false
  let runTime = 0
  
  const globalScope = {
    get t() {return runTime},
    dt: tickDelta,
    
    get running() {return running},
  }
  
  const camera = Camera({
    screen,
    globalScope,
    parent: self,
  })
  
  const field = VectorField({
    screen,
    globalScope,
    camera,
    parent: self,
  })
  
  const axes = Axes({
    screen,
    camera,
    parent: self,
  })
  
  function start() {
    ui.setExpression('\\sin \\left(y\\right)+\\sin \\left(x\\right)i')
  }
  
  function tick() {
    if (running) runTime += tickDelta
  }
  
  function draw() {
    screen.ctx.fillStyle = '#000'
    screen.ctx.fillRect(0, 0, screen.width, screen.height)
  }
  
  function startRunning() {
    running = true
    
    ui.mathField.blur()
    ui.expressionEnvelope.setAttribute('disabled', true)
    
    self.sendEvent('startRunning', [])
    
    requestDraw()
  }
  
  function stopRunning() {
    runTime = 0
    running = false
    
    ui.mathField.blur()
    ui.expressionEnvelope.setAttribute('disabled', false)
    
    if (!navigating) {
      // HACK: Timed to avoid bug in Safari (at least) that causes whole page to be permanently offset when off-screen text input is focused
      setTimeout(() => ui.expressionText.focus(), 250)
    }
    
    self.sendEvent('stopRunning', [])
    
    requestDraw()
  }
  
  function toggleRunning() {
    if (running) stopRunning()
    else startRunning()
  }
  
  return self.mix({
    start,
    tick,
    draw,
    
    toggleRunning,
  })
}