function Scroll(spec) {
  const {
    self,
    ui,
    parentNode,
    world,
  } = Entity(spec, 'Scroll')

  let settingExpressions = false

  const scroll = d3.select(parentNode).append('div')
      .attr('class', 'scroll')

  const buttonsEnvelope = scroll.append('div')
      .attr('class', 'envelope')
      .attr('id', 'scroll-buttons')
  
  const addVerseButton = buttonsEnvelope.append('div')
      .attr('class', 'button')
      .attr('id', 'add-verse-button')
      .on('click', () => {
        appendQuillVerse()
        refresh()
      })

  const addVerseButtonString = addVerseButton.append('div')
      .attr('class', 'string')
      .text('+')

  const addVerseMessage = buttonsEnvelope.append('div')
      .attr('class', 'label')
      .attr('id', 'add-verse-message')
  
  const addVerseMessageString = addVerseButton.append('div')
      .attr('class', 'string')

  const verseEnvelope = scroll.append('div')
      .attr('class', 'envelope')
      .attr('id', 'verse-envelope')

  // Beads
  const svg = d3.select('svg')
  const beadLayer = d3.select('#bead-layer')

  const verses = []

  function clearVerses() {
    let v
    while (v = verses.pop()) v.destroy()
  }

  function removeVerse(verse, refreshNow=true) {
    if (_.isNumber(verse))
      verse = verses[verse]

    _.remove(verses, v => v == verse)
    verse.destroy()

    if (refreshNow)
      refresh()
  }

  function appendQuillVerse() {
    addVerse({type: 'QuillVerse'})
  }

  function addVerse(data, index=-1) {
    if (index < 0)
      index = verses.length

    const verse = window[data.type || 'QuillVerse']({
      ...data,
      parent: self,
      parentNode: verseEnvelope.node(),
      index,
      raiseDragVerse,
      lowerDragVerse,
      getVerseByRelativeIndex,
    })

    verses.splice(index, 0, verse)
  }

  function setVerses(verseData) {
    clearVerses()

    // Ensure 1 divider is present
    const dividerCount = _.filter(verseData, v => v.type == 'DividerVerse').length
    for (let i = 0; i < 1-dividerCount; i++)
      verseData.unshift({type: 'DividerVerse'})

    let stage = 0
    for (data of verseData) {
      const verse = addVerse(data)
    }
    
    refresh()
  }

  function getExpressions() {
    return _.map(verses, v => v.getExpression())
  }
  
  function getLatexs() {
    return _.map(verses, v => v.getLatex())
  }

  function serialize() {
    return _.map(verses, v => v.serialize())
  }

  function refresh(write=true) {
    let i = 2
    
    for (verse of verses) {
      verse.mode = i
      if (verse.divider)
        i--
    }
                     
    world.sendEvent('onChangeLatexs', [getLatexs(), write])
  }

  function resize() {
    svg.attr('width', window.innerWidth)
    svg.attr('height', window.innerHeight)
  }

  function sortDom() {
    let dragNode

    for (verse of verses) {
      if (verse.dragging)
        dragNode = verse.node
      
      verseEnvelope.node().appendChild(verse.placeholder)
      verseEnvelope.node().appendChild(verse.node)
    }

    if (dragNode)
      d3.select(dragNode).raise()
  }

  function setMessage(_message) {
    addVerseMessage.text(_message)
  }

  async function raiseDragVerse() {
    let verse
    let swapVerse
    for (let i = 1; i < verses.length; i++) {
      verse = verses[i]
      swapVerse = verses[i-1]
      if (verse.dragging) {
        
        verses[i] = swapVerse
        verses[i-1] = verse
        break
      }
    }

    sortDom()
    refresh()

    swapVerse.setTranslate(0, -5-verse.placeholder.clientHeight)
    await swapVerse.transitionTranslate(0, 0, 100)
  }

  async function lowerDragVerse() {
    let verse
    let swapVerse
    for (let i = 0; i < verses.length-1; i++) {
      verse = verses[i]
      swapVerse = verses[i+1]
      if (verse.dragging) {
        verses[i] = swapVerse
        verses[i+1] = verse
        break
      }
    }
    
    sortDom()
    refresh()

    swapVerse.setTranslate(0, 5+verse.placeholder.clientHeight)
    await swapVerse.transitionTranslate(0, 0, 100)
  }

  function getVerseByRelativeIndex(verse, i) {
    const visibleVerses = _.filter(verses, 'visible')
    i += _.indexOf(visibleVerses, verse)

    if (i < 0 || i >= visibleVerses.length)
      return null

    return visibleVerses[i]
  }
  
  function setLatexs(expressions) {
    settingExpressions = true
    clearVerses()
    
    setVerses(expressions.map(v => {
        if (v == null)
          return {type: 'DividerVerse'}
        else
          return {latex: v}
      }
    ))
    
    settingExpressions = false
    refresh()
  }

  function onModeChanged(mode) {
    scroll.classed('mode0', mode==0)
    scroll.classed('mode1', mode==1)
    scroll.classed('mode2', mode==2)
  }

  function onChangeBundle(bundle) {
    for (let i = 0; i < verses.length; i++) {
      verses[i].setEvaluator(bundle.evaluators[i])
    }
  }

  return self.extend({
    node: scroll.node(),

    setVerses,
    removeVerse,

    refresh,
    resize,

    setMessage,
    setLatexs,

    onModeChanged,
    serialize,

    onChangeBundle,
  })
}