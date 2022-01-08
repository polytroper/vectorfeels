function Verse(spec) {
  const {
    self,
    parent,
    parentNode,
    base,
    world,
    raiseDragVerse,
    lowerDragVerse,
    getVerseByRelativeIndex,
  } = Entity(spec, 'Verse')

  const baseDestroy = base.destroy
  
  let mode = 0
  let visible = true

  let transitioning = false
  let raising = false
  let lowering = false
  let dragging = false
  let dragOffset = Vector2()

  let trashing = false
  let evaluator = null

  const verse = d3.select(parentNode).append('div')
      .attr('class', 'verse')
  
  const dragPlaceholderDiv = d3.select(parentNode)
    .append('div')
      .attr('class', 'drag-placeholder')
      .style('height', '0px')
      .style('min-width', parentNode.clientWidth+'px')

  const trashBanner = verse.append('div')
      .attr('class', 'trash-banner')
      .style('width', 0)
  
  const trashBannerOutline = trashBanner.append('div')
      .attr('class', 'outline')

  const trashBannerString = trashBanner.append('div')
      .attr('class', 'string')
      .text('🗑')

  const handle = verse.append('div')
      .attr('class', 'label handle')

  const handleString = handle.append('div')
      .attr('class', 'string')
      .text('≡')
      
  const drag = d3.drag()
      .subject(verse)
      .container(parentNode)
      .on('start', dragStart)
      .on('drag', dragMove)
      .on('end', dragEnd)

  handle.call(drag)

  // Appear transition

  verse.classed('appearing', true)

  verse
      .style('transform', `translate(0px, ${-5-verse.node().clientHeight-dragPlaceholderDiv.node().offsetTop}px)`)
    .transition()
      .duration(150)
      .ease(d3.easePolyOut)
      .style('transform', 'translate(0px, -5px)')
  
  dragPlaceholderDiv
      .style('height', '0px')
    .transition()
      .duration(150)
      .ease(d3.easePolyOut)
      .style('height', '30px')
      .end().then(() => {
        hidePlaceholder()
        verse.classed('appearing', false)
            .style('transform', 'translate(0px, 0px)')
      })

  refreshMode()

  function refresh(write=true) {
    parent.refresh(write)
  }

  function getExpression() {
    return ''
  }

  function getLatex() {
    return ''
  }

  function destroy() {
    baseDestroy()
    verse.remove()
  }

  function showPlaceholder() {
    dragPlaceholderDiv.classed('dormant', false)
        .style('height', verse.node().clientHeight+'px')
        .style('width', verse.node().clientWidth+'px')
  }

  function hidePlaceholder() {
    dragPlaceholderDiv.classed('dormant', true)
        .style('height', null)
  }

  function dragStart(e) {
    console.log('drag starting')

    dragging = true
    dragOffset.y = verse.node().offsetTop-e.y-5
    dragOffset.x = verse.node().offsetLeft-e.x

    const verseHeight = verse.node().clientHeight
    const verseWidth = verse.node().clientWidth
    const parentWidth = parentNode.clientWidth

    const y = e.y+dragOffset.y
    const x = math.max(0, e.x+dragOffset.x)

    console.log('start x:', x)

    // Beware, order matters for the following statements!

    verse.classed('dragging', true)

    showPlaceholder()

    verse.style('width', verseWidth+'px')
        .style('top', y+'px')
    
    handle.style('left', x+'px')

    trashBanner.style('width', x+'px')
        .style('height', verseHeight+'px')

    verse.raise()

    const verseAbove = getVerseByRelativeIndex(self, -1)
    const verseBelow = getVerseByRelativeIndex(self, 1)

    console.log('Verse above', verseAbove ? verseAbove.getExpression() : '')
    console.log('Verse below', verseBelow ? verseBelow.getExpression() : '')
  }
  
  async function dragMove(e) {
    const verseHeight = verse.node().clientHeight
    const verseWidth = verse.node().clientWidth
    const parentWidth = parentNode.clientWidth
    const parentHeight = parentNode.clientHeight
    const placeholderY = dragPlaceholderDiv.node().offsetTop

    const maxX = verseWidth-handle.node().clientWidth
    const x = math.clamp(0, maxX, e.x+dragOffset.x)
    const xProgress = x/maxX
    const y = math.clamp(-5, parentHeight-5-verseHeight, math.lerp(e.y+dragOffset.y, placeholderY-5, math.pow(xProgress, 4)))

    const _trashing = trashing
    trashing = xProgress == 1
    
    verse.classed('trashing', trashing)

    if (!_trashing && trashing) {
      trashBanner.style('background', '#FFF')
        .transition()
          .ease(d3.easePolyOut)
          .duration(1000)
          .style('background', '#000')
    }
    else if (_trashing && !trashing) {
      trashBanner.transition()
          .duration(500)
          .style('background', '#F00')
    }

    verse.style('top', y+'px')

    handle.style('left', x+'px')

    trashBanner.style('width', x+'px')
        .style('height', verseHeight+'px')

    const verseAbove = getVerseByRelativeIndex(self, -1)
    const verseBelow = getVerseByRelativeIndex(self, 1)

    if (verseAbove && y+5 <= verseAbove.placeholder.offsetTop) {
      console.log('BEGINNING RAISE')
      transitioning = true
      raising = true
      await raiseDragVerse()
      console.log('ENDING RAISE')
      transitioning = false
      raising = false
    }
    if (verseBelow && y+verseHeight+5 >= verseBelow.placeholder.offsetTop+verseBelow.node.clientHeight) {
      console.log('BEGINNING LOWER', y+verseHeight, verseBelow.placeholder.offsetTop)
      transitioning = true
      lowering = true
      await lowerDragVerse()
      console.log('ENDING LOWER')
      transitioning = false
      lowering = false
    }
  }

  function dragEnd() {
    console.log('drag ending')
    const verseHeight = verse.node().clientHeight
    const placeholderY = dragPlaceholderDiv.node().offsetTop

    dragging = false

    if (trashing) {
      transitioning = true
      verse.classed('transitioning', true)
          .style('opacity', 1)
        .transition()
          .duration(150)
          .style('opacity', 0)

      dragPlaceholderDiv.classed('dormant', false)
        .transition()
          .duration(200)
          .style('height', '0px')
          .end().then(() => {
            dragPlaceholderDiv.remove()
            parent.removeVerse(self)
          })
    }
    else {
      transitioning = true
      verse.classed('transitioning', true)

      verse.transition()
          .duration(200)
          .style('top', placeholderY-5+'px')
          .end().then(() => {
            transitioning = false
            verse.classed('transitioning', false)

            verse.classed('dragging', false)
                .style('top', null)
                .style('width', null)

            dragPlaceholderDiv.node().after(verse.node())

            hidePlaceholder()
          })

      handle.transition()
          .duration(300)
          .style('left', '0px')

      trashBanner.transition()
          .duration(300)
          .style('width', '0px')
    }
  }

  async function transitionTranslate(x, y, duration=100) {
    transitioning = true
    verse.classed('transitioning', true)
    await verse.transition()
        .duration(duration)
        .ease(d3.easePolyOut)
        // .style('top', y+'px')
        .style('transform', `translate(${x}px, ${y}px)`)
        .end()
    transitioning = false
    verse.classed('transitioning', false)
  }

  function setTranslate(x, y) {
    verse.style('transform', `translate(${x}px, ${y}px)`)
  }

  function resetTranslate() {
    verse.style('transform', `translate(0px, 0px)`)
  }

  function hide() {
    visible = false
    verse.classed('hide', true)
    self.sendEvent('onHide')
  }

  function show() {
    visible = true
    verse.classed('hide', false)
    self.sendEvent('onShow')
  }

  function refreshMode() {
    verse.classed('mode0', mode == 0)
    verse.classed('mode1', mode == 1)
    verse.classed('mode2', mode == 2)

    const hiddenDivider = self.divider && world.mode != 2
    
    if ((mode > world.mode && mode > 1) || hiddenDivider)
      hide()
    else
      show()
  }
  
  function onModeChanged() {
    refreshMode()
  }

  function setEvaluator(_evaluator) {
    evaluator = _evaluator
  }
  
  return self.extend({
    node: verse.node(),
    
    get placeholder() {
      return dragPlaceholderDiv ?
        dragPlaceholderDiv.node() : null
    },
    
    get sortNode() {
      return dragPlaceholderDiv ?
        dragPlaceholderDiv.node() : verse.node()
    },

    get dragging() {return dragging},

    get mode() {return mode},
    set mode(v) {mode = v; refreshMode()},

    get visible() {return visible},

    transitionTranslate,
    resetTranslate,
    setTranslate,
    
    get expression() {return self.getExpression()},
    get latex() {return self.getLatex()},

    getExpression,
    getLatex,
    refresh,

    destroy,

    onModeChanged,
    
    setEvaluator,
    get evaluator() {return evaluator},
  })
}