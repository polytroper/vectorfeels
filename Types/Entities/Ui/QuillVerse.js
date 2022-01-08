function QuillVerse(spec) {
  const {
    self,
    node,
    refresh,
    screen,
    camera,
    base,
    world,
    expression = '',
  } = Verse(spec)

  const transform = Transform(spec, self)

  let variableString
  let valueString

  let text
  let latex = spec.latex || ''

  let settingLatex = false

  let beadEnabled = false
  let dragging = false

  // Quill
  const verse = d3.select(node)
      .classed('quill', true)

  const envelope = verse.insert('div', '*:first-child')
      .attr('class', 'envelope')

  const quillStatic = MQ.StaticMath(envelope.node())
  const quill = MQ.MathField(envelope.node(), {
    handlers: {
      edit: editQuill
    }
  })

  envelope.on('focusin', onFocus)
  envelope.on('focusout', onBlur)

  quill.text = function() {
    var tex = quill.latex()
    return mathquillToMathJS(tex)
  }

  // Bead
  const beadLayer = d3.select($('#bead-layer'))

  const bead = beadLayer.append('g')
      .attr('class', 'bead')
      .attr('hide', true)

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

  const beadName = bead.append('text')
      .attr('alignment-baseline', 'hanging')
      .attr('text-anchor', 'left')
      .attr('x', 4)
      .attr('y', 4)
  
  const drag = d3.drag()
      .on('start', dragStart)
      .on('drag', dragMove)
      .on('end', dragEnd)
  
  bead.call(drag)

  refreshBead()

  const screenPosition = Vector2()

  // Set quill latex
  
  settingLatex = true
  quill.latex(latex)
  settingLatex = false

  function dragStart() {
    dragging = true
  }

  function dragMove(e) {
    screenPosition.set(e.x, e.y)
    camera.screenToWorld(screenPosition, transform.position)

    const x = math.truncate(transform.position.x, 1)
    const sign = transform.position.y >= 0 ? '+' : ''
    const y = math.truncate(transform.position.y, 1)

    valueString = `${x}${sign}${y}i`

    latex = variableString ?
      variableString+'='+valueString :
      valueString

    text = latex

    quill.latex(latex)
    quillStatic.latex(latex)

    console.log('Dragging evaluator expression: ', self.expression)
    base.evaluator.setConstantExpression(mathquillToMathJS(latex))
    world.modify()
    // refresh(false)

  }

  function dragEnd() {
    dragging = false
    world.save()
  }

  function onFocus() {
    verse.classed('focused', true)
  }

  function onBlur() {
    verse.classed('focused', false)
  }

  function editQuill() {
    if (dragging)
      return
    
    text = quill.text()
    latex = quill.latex()
    
    quillStatic.latex(latex)

    refreshBead()

    if (!settingLatex)
      refresh()
  }

  function refreshBead() {
    const match = latex.match(/^(\w[\w\d]*)\s*=(.*)$/)

    if (match && self.visible) {
      variableString = match[1]
      valueString = match[2]

      beadName.text(variableString)

      try {
        const c = math.complex(match[2])
        transform.position.set(c.re, c.im)

        enableBead()
      }
      catch (ex) {
        disableBead()
      }
    }
    else
      disableBead()
  }

  function enableBead() {
    if (!beadEnabled) {
      beadEnabled = true
      bead.attr('hide', false)
    }
  }

  function disableBead() {
    if (beadEnabled) {
      beadEnabled = false
      bead.attr('hide', true)
    }
  }

  function draw() {
    camera.worldToScreen(transform.position, screenPosition)
    bead.attr('transform', `translate(${screenPosition.x},${screenPosition.y})`)
  }

  function destroy() {
    base.destroy()
    bead.remove()
  }

  function getExpression() {
    return quill.text()
  }

  function getLatex() {
    return quill.latex()
  }

  function serialize() {
    return getLatex()
  }

  function refreshMode() {
    base.refreshMode()
  }

  function onHide() {
    refreshBead()
  }

  function onShow() {
    refreshBead()
  }

  return self.extend({
    getExpression,
    getLatex,
    serialize,

    draw,
    destroy,

    refreshMode,

    onHide,
    onShow,
  })
}