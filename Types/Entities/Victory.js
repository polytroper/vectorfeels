function Victory(spec) {
  const {
    self,
    screen,
    camera,
    ctx,
  } = Entity(spec, 'Victory')
  
  const transform = Transform()
  
  const origin = Vector2()
  const screenOrigin = Vector2()

  let showing = false
  let winDuration = 0
  let winLength = 0
  
  function tick() {
    
  }
  
  function draw() {
    if (!showing)
      return

    camera.worldToScreen(origin, screenOrigin)

    const s = screen.frameToScreenScalar()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'

    ctx.fillStyle = '#F8F8F8'
    ctx.font = s*0.25+'px Orbitron'
    ctx.fillText('VICTORY', screenOrigin.x, screenOrigin.y-s*0.05)

    ctx.font = s*0.15+'px Orbitron'
    ctx.fillText(math.truncate(winDuration, 1)+' SECONDS', screenOrigin.x, screenOrigin.y+s*0.15)
  }

  function show(duration, length) {
    showing = true
    winDuration = duration
    winLength = length
  }

  function hide() {
    showing = false
  }
  
  return self.extend({
    transform,
    
    tick,
    draw,

    show,
    hide,
  })
}