function Collector(spec = {}) {
  const {
    self,
    screen,
    camera,
    field,
    globalScope
  } = Entity(spec, 'Collector')
  
  const transform = Transform(spec, self)
  
  const floater = Floater({
    globalScope,
    screen,
    camera,
    field,
    transform,
  })
  
  let {
    size = 1,
  } = spec

  const origin = Vector2(transform.position)
  
  const ctx = screen.ctx
  
  // const trail = Trail({
  //   parent: self,
  // })
  
  reset()

  function start() {
    // trail.reset()
  }
  
  function tick() {
    floater.tick()
  }

  function drawLocal() {
    ctx.strokeStyle = '#FFF'
    ctx.fillStyle = '#222'
    
    ctx.lineWidth = 0.1
    
    ctx.beginPath()
    ctx.arc(0, 0, size/2, 0, TAU)
    // ctx.fill()
    ctx.stroke()
  }
  
  function draw() {
    camera.drawThrough(ctx, drawLocal, transform)
    // floater.draw(ctx)
  }
  
  function startRunning() {
  }
  
  function stopRunning() {
    floater.resetVelocity()
    reset()
  }
  
  function reset() {
    transform.x = origin.x
    transform.y = origin.y
    
    let angle = floater.upright.angle-PI/2
    transform.rotation = angle
    
    // trail.reset()
  }
  
  return self.extend({
    transform,
    
    start,
    tick,
    draw,
    
    startRunning,
    stopRunning,
    
    reset,

    size,
  })
}