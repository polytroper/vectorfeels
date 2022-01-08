function FreeGoal(spec) {
  const {
    self,
    base,
    screen,
    camera,
    transform,
    field,
    world,
    engine,
    ctx,
    size = 0.1,
  } = Goal(spec, 'FreeGoal')
  
  const floater = Floater({
    screen,
    camera,
    field,
    transform,
    world,
    engine,
  })

  const origin = Vector2(transform.position)
  
  // const trail = Trail({
  //   parent: self,
  // })
  
  reset()

  function start() {
    // trail.reset()
    console.log(base)
  }

  function tick() {
    floater.tick()
  }
  
  function drawLocal() {
    ctx.fillStyle = self.fillStyle
    
    ctx.lineWidth = self.strokeWidth

    ctx.beginPath()
    ctx.arc(0, 0, size, 0, TAU)
    ctx.fill()
  }
  
  function draw() {
    // Set alpha to fade with flash if completed
    self.setAlphaByFlashFade()
    
    camera.drawThrough(ctx, drawLocal, transform)
    base.draw()
    
    // Reset alpha
    ctx.globalAlpha = 1
  }
  
  function startRunning() {
  }
  
  function stopRunning() {
    floater.resetVelocity()
    reset()
  }
  
  function reset() {
    base.reset()

    transform.position.set(origin)
    
    let angle = floater.upright.angle-PI/2
    transform.rotation = angle
    
    // trail.reset()
  }
  
  return self.extend({
    start,
    tick,
    draw,

    reset,

    startRunning,
    stopRunning,
  })
}