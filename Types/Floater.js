function Floater(spec) {
  let {
    transform,
    graph,
    world,
    engine,
    field,
    camera,
    screen,
    fixed = false,
    fixedRotation = false,
    rotationCoefficient = 0.03,
    positionOffset = Vector2(),
  } = spec

  const scope = {
    p: math.complex()
  }
  
  const velocity = Vector2()
  const delta = Vector2()
  const upright = Vector2(0, 1)
  
  const samplePosition = Vector2()

  const debugVectorOrigin = Vector2()
  const debugVectorTerminus = Vector2()

  const slope = Vector2()
  const direction = Vector2()

  const smoothDirection = Vector2(1, 0)
  
  function tick() {
    if (!world.running || fixed) {
      
    }
    else {
      integrateRK4()
    }

    if (!fixedRotation) {
      field.sampleAt(transform.position, velocity)

      if (velocity.x == 0 && velocity.y == 0)
        direction.set(smoothDirection)
      else {
        direction.set(velocity)
        direction.normalize()
      }

      smoothDirection.lerp(direction, rotationCoefficient)
      smoothDirection.normalize()

      transform.rotation = Math.atan2(smoothDirection.y, smoothDirection.x)
      console.log('Setting floater velocity to ', velocity.toString())
    }

    return
  }

  function integrateEuler() {
    // Sample field velocity
    field.sampleAt(transform.position, velocity)

    // Compute position delta
    velocity.multiply(engine.tickDelta, delta)
    
    // Integrate delta
    transform.position.add(delta)
  }

  function integrateRK4() {
    samplePosition.set(transform.position)
    velocity.set()

    // First order
    field.sampleAt(samplePosition, slope)
    slope.multiply(engine.tickDelta/2, delta)
    velocity.add(slope)

    transform.position.add(delta, samplePosition)

    // Second order
    field.sampleAt(samplePosition, slope)
    slope.multiply(engine.tickDelta/2, delta)
    velocity.add(slope.multiply(2))

    transform.position.add(delta, samplePosition)

    // Third order
    field.sampleAt(samplePosition, slope)
    slope.multiply(engine.tickDelta/2, delta)
    velocity.add(slope.multiply(2))

    transform.position.add(delta, samplePosition)

    // Fourth order
    field.sampleAt(samplePosition, slope)
    velocity.add(slope)

    // Divide to get weighted average of slopes
    velocity.divide(6)

    // Compute position delta
    velocity.multiply(engine.tickDelta, delta)
    
    // Integrate delta
    transform.position.add(delta)
  }
  
  function drawDebugVector(ctx, vector, color) {
    camera.worldToScreen(transform.position, debugVectorOrigin)
    
    debugVectorTerminus.set(vector)
    debugVectorTerminus.add(transform.position)
    camera.worldToScreen(debugVectorTerminus)
    
    ctx.beginPath()
    ctx.moveTo(debugVectorOrigin.x, debugVectorOrigin.y)
    ctx.lineTo(debugVectorTerminus.x, debugVectorTerminus.y)
    
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.stroke()
  }
  
  function draw(ctx) {
    drawDebugVector(ctx, velocity, 'blue')
    drawDebugVector(ctx, upright, 'green')
  }
  
  function resetVelocity() {
    velocity.set()
  }
  
  return {
    get velocity() {return velocity},
    set velocity(v) {velocity.set(v)},
    
    get upright() {return upright},
    set upright(v) {upright.set(v)},
    
    resetVelocity,
    
    tick,
    draw,
  }
}