function Collector(spec = {}) {
  const {
    self,
    screen,
    camera,
    field,
    world,
    engine,
    size = 1
  } = Entity(spec, 'Collector')
  
  const transform = Transform(spec, self)
  
  const floater = Floater({
    screen,
    camera,
    field,
    transform,
    world,
    engine,
  })

  const origin = Vector2(transform.position)
  
  const ctx = screen.ctx
  
  // const trail = Trail({
  //   parent: self,
  // })
  
  reset()

  const sprite = Sprite({
    asset: 'images.mouse',
    size: size*1.3,
    parent: self,
  })

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
    // ctx.arc(0, 0, size/2, 0, TAU)
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
    transform.position.set(origin)
    
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