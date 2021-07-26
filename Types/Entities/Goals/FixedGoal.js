function FixedGoal(spec) {
  const {
    self,
    screen,
    camera,
    transform,
    ctx,
    size = 0.1,
  } = Goal(spec, 'FixedGoal')
  
  const shape = Rect({
    transform,
    width: size,
    height: size,
  })
  
  function drawLocal() {
    ctx.fillStyle = self.fillStyle
    
    ctx.lineWidth = self.strokeWidth

    ctx.beginPath()
    ctx.rect(-size, -size, size*2, size*2)
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