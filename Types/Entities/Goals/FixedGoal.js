function FixedGoal(spec) {
  const {
    self,
    screen,
    camera,
    transform,
    ctx,
  } = Goal(spec, 'Fixed Goal')
  
  let {
    size = 0.1,
  } = spec
  
  const shape = Rect({
    transform,
    width: size,
    height: size,
  })
  
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
    
    // Reset alpha
    ctx.globalAlpha = 1
  }
  
  return self.extend({
    draw,
    shape,
  })
}