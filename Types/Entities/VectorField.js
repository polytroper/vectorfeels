function VectorField(spec) {
  const {
    self,
    
    ui,
    ctx,
    screen,
    camera,

    useAcceleration = false,
  } = Entity(spec, 'VectorField')
  
  const {
    globalScope,
  } = spec
  
  const scope = {
    p: math.complex()
  }
  
  const sampler = Sampler({
    scope
  })
  sampler.setExpression('-y+x*i')
  
  const layer = document.createElement('canvas')
  const layerCtx = layer.getContext('2d')
  
  const particles = []
  const particleCount = 1024
  const particleTimeMin = 2
  const particleTimeMax = 4
  
  const particleDelta = Vector2()
  
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
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]
      
      if (particle.timer <= 0) {
        randomizeParticle(particle)
      }
      
      particle.timer -= globalScope.dt
      
      scope.p.re = particle.position.x
      scope.p.im = particle.position.y
      
      scope.x = particle.position.x
      scope.y = particle.position.y
      
      let sample = sampler.sample()
      
      // if (i == 0)
        // console.log(sample.toString())
      
      particle.sample.x = math.re(sample)
      particle.sample.y = math.im(sample)

      if (useAcceleration) {
        particle.velocity.x += math.re(sample)*globalScope.dt
        particle.velocity.y += math.im(sample)*globalScope.dt

        particle.velocity.multiply(globalScope.dt, particleDelta)
        particle.position.add(particleDelta)
      }
      else {
        particle.sample.multiply(globalScope.dt, particleDelta)
        particle.position.add(particleDelta)
      }
    }
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
      
      // if (i == 0) console.log(particle.timer.toString())
      
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
  
  function setGraphExpression(text) {
    sampler.setExpression(text)
  }
  
  return self.mix({
    start,
    
    tick,
    draw,
    
    resize,
    setGraphExpression,
  })
}