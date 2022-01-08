function Sprite(spec = {}) {
  const {
    self,
    screen,
    camera,
    assets,
  } = Entity(spec, 'Sprite')
  
  const transform = Transform(spec, self)
  
  let {
    asset,
    image,
    size = 1,
    flipX = false,
    flipY = false,
    offset = Vector2(),
    speech,
    opacity = 1,
  } = spec
  
  const origin = Vector2(spec)
  
  // if (!spec.offset)
  //   offset.y = 1
    
  // if (!spec.offset && spec.y)
  //   offset.y += spec.y
  
  const ctx = screen.ctx
  
  const slopeTangent = Vector2()
  
  if (asset) {
    image = _.get(assets, asset, $('#error-sprite'))
  }
  
  if (speech) {
    if (!_.isArray(speech))
      speech = [speech]
      
    for (s of speech) {
      if (_.isString(s))
        s = {content: s}
        
      Speech({
        parent: self,
        x: size*offset.x,
        y: size*offset.y,
        ...s,
      })
    }
  }
  
  function tick() {
  }
  
  function drawLocal() {
    const _opacity = opacity
    ctx.globalAlpha = opacity

    ctx.scale(flipX ? -1 : 1, flipY ? 1 : -1)
    ctx.drawImage(image, -size/2-offset.x*size/2, -size/2-offset.y*size/2, size, size)

    ctx.globalAlpha = _opacity
  }
  
  function draw() {
    camera.drawThrough(ctx, drawLocal, transform)
  }
  
  return self.extend({
    transform,

    tick,
    draw,

    get opacity() {return opacity},
    set opacity(v) {opacity = v},
    
    get flipX() {return flipX},
    set flipX(v) {flipX = v},
    
    get flipY() {return flipY},
    set flipY(v) {flipY = v},
  })
}