function FixedGoal(spec) {
  const {
    self,
    base,
    screen,
    camera,
    transform,
    ctx,
    size = 0.2,
  } = Goal(spec, 'FixedGoal')
  
  const shape = Rect({
    transform,
    width: size,
    height: size,
  })

  const sprite = Sprite({
    asset: 'images.cheese',
    size: size*2,
    parent: self,
  })
  
  function drawLocal() {
    ctx.fillStyle = self.fillStyle
    
    ctx.lineWidth = self.strokeWidth

    ctx.beginPath()
    // ctx.rect(-size, -size, size*2, size*2)
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

  function onSetOpacity(opacity) {
    sprite.opacity = opacity
  }
  
  return self.extend({
    draw,
    shape,
    onSetOpacity,
  })
}