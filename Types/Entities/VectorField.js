function VectorField(spec) {
  const {
    self,
    log,
    
    ui,
    world,
    screen,
    camera,
    engine,
  } = Entity(spec, 'VectorField')

  const ctx = screen.ctx
  const p = math.complex()
  
  let bundle
  
  const layer = document.createElement('canvas')
  const layerCtx = layer.getContext('2d')
  
  const particles = []
  const particleCount = 1024
  const particleTimeMin = 2
  const particleTimeMax = 4
  
  const particleSlope = Vector2()
  const particleDelta = Vector2()
  
  const samplePosition = Vector2()
  const positionLocal = Vector2()
  
  const randomizeParticle = (particle) => {
    particle.timer = math.lerp(particleTimeMin, particleTimeMax, particle.seed)

    particle.position.x = math.lerp(camera.lowerLeft.x, camera.upperRight.x, math.random())
    particle.position.y = math.lerp(camera.lowerLeft.y, camera.upperRight.y, math.random())
    
    particle.lastPosition.set(particle.position)
    particle.velocity.set()
    
    return particle
  }
  
  function start() {
    for (let i = 0; i < particleCount; i++) {
      const seed = math.random()

      const particle = {
        seed,
        timer: math.lerp(particleTimeMin, particleTimeMax, seed),
        velocity: Vector2(),
        position: Vector2(),
        lastPosition: Vector2(),
        color: ColorHSV((200+seed*40)/360, 1, 1),
        sample: Vector2()
      }
      
      randomizeParticle(particle)
      particle.timer *= math.random()

      particles.push(particle)
    }
  }
  
  function tick() {
    bundle.assign('t', world.runTime)
    
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]
      
      if (particle.timer <= 0) {
        randomizeParticle(particle)
      }
      
      particle.timer -= engine.tickDelta
      
      integrateEuler(particle)
    }
  }

  function integrateEuler(particle) {
    sampleAt(particle.position, particle.sample)
    particle.sample.multiply(engine.tickDelta, particleDelta)
    particle.position.add(particleDelta)
  }

  function integrateRK4(particle) {
    samplePosition.set(particle.position)
    particle.velocity.set()

    // First order
    sampleAt(samplePosition, particleSlope)
    particleSlope.multiply(engine.tickDelta/2, particleDelta)
    particle.velocity.add(particleSlope)

    particle.position.add(particleDelta, samplePosition)

    // Second order
    sampleAt(samplePosition, particleSlope)
    particleSlope.multiply(engine.tickDelta/2, particleDelta)
    particle.velocity.add(particleSlope.multiply(2))

    particle.position.add(particleDelta, samplePosition)

    // Third order
    sampleAt(samplePosition, particleSlope)
    particleSlope.multiply(engine.tickDelta/2, particleDelta)
    particle.velocity.add(particleSlope.multiply(2))

    particle.position.add(particleDelta, samplePosition)

    // Fourth order
    sampleAt(samplePosition, particleSlope)
    particle.velocity.add(particleSlope)

    // Divide to get weighted average of slopes
    particle.velocity.divide(6)

    // Compute position delta
    particle.velocity.multiply(engine.tickDelta, particleDelta)
    
    // Integrate delta
    particle.position.add(particleDelta)
  }
  
  function drawLocal(context) {
    context.lineWidth = camera.screenToWorldScalar()
    
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]
      
      context.strokeStyle = particle.color.hex
      context.beginPath()
      context.moveTo(particle.lastPosition.x, particle.lastPosition.y)
      context.lineTo(particle.position.x, particle.position.y)
      context.stroke()
      
      // Now that the line has been drawn, align the last drawn position with the new drawn position
      particle.lastPosition.set(particle.position)
    }
  }
  
  function draw() {
    layerCtx.fillStyle = 'rgba(0, 0, 0, 0.05)'
    layerCtx.fillRect(0, 0, screen.width, screen.height)
    
    camera.drawThrough(layerCtx, drawLocal)
    
    ctx.drawImage(layer, 0, 0)
  }
  
  function resize() {
    layer.width = screen.width
    layer.height = screen.height
  }

  function sampleAt(point, output) {
    p.re = point.x
    p.im = point.y

    if (!output)
      output = point

    let sample = bundle.sample('p', p, 'x', point.x, 'y', point.y)

    return math.makeNumerical(sample, output)
  }

  function onChangeBundle(_bundle) {
    bundle = _bundle
  }
  
  return self.extend({
    start,   
    tick,
    draw,
    resize,

    sampleAt,

    onChangeBundle,
  })
}