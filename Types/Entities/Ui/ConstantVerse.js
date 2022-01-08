function ConstantVerse(spec) {
  const {
    self,
    node,
    refresh,
    screen,
    camera,
    base,
  } = Verse(spec)

  let {
    variableString = 'c',
    valueString = '0+0i',
  } = self

  const transform = Transform(spec, self)

  const verse = d3.select(node)
      .classed('constant', true)

  const variableEnvelope = verse.append('div')
      .attr('class', 'text-sizer')

  const variableDummy = variableEnvelope.append('div')
      .attr('class', 'variable dummy')

  const variableDummyString = variableDummy.append('div')
      .attr('class', 'string')
      .text(variableString)

  const variableInput = variableEnvelope.append('input')
      .attr('type', 'text')
      .attr('class', 'variable')
      .on('input', onVariableInputChange)

  variableInput.node().value = variableString

  const operator = verse.append('div')
      .attr('class', 'label operator')

  const operatorLabelString = operator.append('div')
      .attr('class', 'string')
      .text('=')

  const value = verse.append('div')
      .attr('class', 'label')

  const valueLabelString = value.append('div')
      .attr('class', 'string')
      .text(valueString)

  // Bead
  const beadLayer = d3.select($('#bead-layer'))

  const bead = beadLayer.append('g')
      .attr('class', 'bead')

  const beadCircle = bead.append('circle')
      .attr('r', 6)

  const beadLine0 = bead.append('line')
      .attr('x1', -4)
      .attr('x2', 4)
      .attr('y1', 0)
      .attr('y2', 0)

  const beadLine1 = bead.append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', -4)
      .attr('y2', 4)
  
  const drag = d3.drag()
      .on('start', dragStart)
      .on('drag', dragMove)
      .on('end', dragEnd)
  
  bead.call(drag)

  const screenPosition = Vector2()

  function getExpression() {
    return variableString + '=' + valueString
  }

  function dragStart() {

  }

  function dragMove(e) {
    screenPosition.set(e.x, e.y)
    camera.screenToWorld(screenPosition, transform.position)

    const x = math.truncate(transform.position.x, 1)
    const sign = transform.position.y >= 0 ? '+' : ''
    const y = math.truncate(transform.position.y, 1)

    valueString = `${x}${sign}${y}i`
    
    valueLabelString.text(valueString)
    refresh()
  }

  function dragEnd() {

  }

  function onVariableInputChange() {
    variableString = variableInput.node().value
    variableDummyString.text(variableString)
    const w = variableDummy.node().clientWidth
    console.log(w)
    variableInput.style('width', variableDummy.node().clientWidth+'px')
    refresh()
  }

  function draw() {
    camera.worldToScreen(transform.position, screenPosition)
    bead.attr('transform', `translate(${screenPosition.x},${screenPosition.y})`)
  }

  function destroy() {
    base.destroy()
    bead.remove()
  }

  return self.extend({
    getExpression,

    draw,
    
    destroy,
  })
}