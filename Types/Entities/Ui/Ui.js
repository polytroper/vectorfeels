function Ui(spec) {
  const {
    self,
    parse,
    engine,
    parent,
  } = Entity(spec, 'Ui')

  const scroll = Scroll({
    parent: self,
    ui: self,
    parentNode: $('#ui'),
  })

  let writingExpression = false
  let writingLevelText = false

  const controlBar = $('#controls-bar')

  const editor = $('#editor')
  const levelText = $('#level-text')
  
  const variableLabel = $('#variable-label')

  const restartButton = $('#restart-button')

  const expressionEnvelope = $('#expression-envelope')

  const runButton = $('#run-button')
  const runButtonString = $('#run-button > .string')

  const veil = $('#veil')
  const loadingVeil = $('#loading-veil')
  const loadingVeilString = $('#loading-string')

  d3.select(runButton).raise()
  d3.select(restartButton).raise()

  levelText.addEventListener('input', (event) => {
    if (writingLevelText)
      return

    engine.world.sendEvent('onChangeLevelText', [levelText.value])
  })

  function setLevelText(text) {
    writingLevelText = true
    levelText.value = text
    writingLevelText = false
  }

  function setMessage(message) {
    scroll.setMessage(message)
  }

  function sendWorldEvent(channel, message) {
    parent.sendEvent(channel, [message])
  }

  function setShowRestartButton(show) {
    d3.select(restartButton).attr('hide', !show)
  }
  
  return self.extend({
    expressionEnvelope,

    variableLabel,

    restartButton,

    runButton,
    runButtonString,

    veil,
    loadingVeil,
    loadingVeilString,

    editor,
    levelText,

    setLevelText,
    setMessage,
    setShowRestartButton,

    scroll,

    sendWorldEvent,
  })
}