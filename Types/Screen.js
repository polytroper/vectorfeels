// The Screen transforms the "Frame" into screen-space coordinates.
//
// The Frame is a normalized representation of the screen, where a square quadrant is fitted into the center.
//
// A helpful diagram of the Frame:
//
//          +1 (screen top)
// +----+---------+----+
// |    |    |    |    |
// |    |    |    |    |
// |  -1|----+----|+1  | (screen right)
// |    |    |    |    |
// |    |    |    |    |
// +----+---------+----+
//          -1

function Screen(spec = {}) {
  const transform = Transform()
  
  let {
    canvas,
    element = window
  } = spec
  
  const ctx = canvas.getContext('2d')
  
  let width
  let height
  
  let vertical
  let aspect
  
  const minFramePoint = Vector2()
  const maxFramePoint = Vector2()
  
  function resize() {
    width = element.innerWidth || element.width || 512
    height = element.innerHeight || element.height || 512
    
    canvas.width = width
    canvas.height = height
    
    transform.x = width/2
    transform.y = height/2

    const scale = math.min(width, height)/2
    transform.scale.x = scale
    transform.scale.y = -scale
    
    vertical = height > width
    aspect = width/height
    
    minFramePoint[0] = vertical ? -1 : -aspect
    minFramePoint[1] = vertical ? -1/aspect : -1
    
    maxFramePoint[0] = vertical ? 1 : aspect
    maxFramePoint[1] = vertical ? 1/aspect : 1

    // console.log('minFramePoint: ', minFramePoint.toString())
    // console.log('maxFramePoint: ', maxFramePoint.toString())
  }
  
  function screenToFrame(point, output) {
    if (!output) output = point
    
    transform.invertPoint(point, output)
    // output.y *= -1
    
    return output
  }
  
  function frameToScreen(point, output) {
    if (!output) output = point
    
    output.set(point)
    
    // output.y *= -1
    transform.transformPoint(output)
    
    return output
  }
  
  function screenToFrameDirection(direction, output) {
    if (!output) output = direction
    
    transform.invertDirection(direction, output)
    // output.y *= -1
    
    return output
  }
  
  function frameToScreenDirection(direction, output) {
    if (!output) output = direction
    
    output.set(direction)
    
    // output.y *= -1
    transform.transformDirection(output)
    
    return output
  }

  function screenToFrameScalar(scalar=1) {
    return transform.invertScalar(scalar)
  }

  function frameToScreenScalar(scalar=1) {
    return transform.transformScalar(scalar)
  }
  
  resize()
  
  return {
    transform,
    
    canvas,
    ctx,
    
    resize,
    
    screenToFrame,
    frameToScreen,
    
    screenToFrameDirection,
    frameToScreenDirection,
    
    screenToFrameScalar,
    frameToScreenScalar,
    
    get width() {return width},
    get height() {return height},
    
    get vertical() {return height},
    get aspect() {return aspect},
    
    get minFramePoint() {return minFramePoint},
    get maxFramePoint() {return maxFramePoint},
  }
}