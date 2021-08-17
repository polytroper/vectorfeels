function World(spec) {
  const {
    self,
    ui,
    screen,
    engine,
    log,
  } = Entity(spec, 'World')

  let editing = false
  let running = false
  let runTime = 0

  let data = Data(spec.data)
  let level
  
  const globalScope = {
    get t() {return runTime},
    get dt() {return engine.tickDelta},

    get pi() {return PI},
    get tau() {return TAU},
    
    get running() {return running},
  }

  self.essentials.globalScope = globalScope
  self.essentials.ctx = screen.ctx
  
  const camera = Camera({
    parent: self,
    // debug: true,
  })

  self.essentials.camera = camera
  
  const field = VectorField({
    parent: self,
  })
  
  const victory = Victory({
    parent: self,
  })
  
  const axes = Axes({
    parent: self,
  })
  
  self.essentials.field = field

  function start() {
    loadData(data)

    ui.setLevelText(data.levelText)
  }
  
  function tick() {
    if (running) runTime += engine.tickDelta

    let runTimeString = (Math.round(runTime*10)/10).toString()
    
    if (running && !_.includes(runTimeString, '.'))
      runTimeString += '.0'
    
    ui.runButtonString.innerHTML = 'T='+runTimeString
  }
  
  function draw() {
    screen.ctx.fillStyle = '#000'
    screen.ctx.fillRect(0, 0, screen.width, screen.height)
  }

  function loadLevelText(str) {
    console.log(`Loading level text:`, str)
    let d = Data({
      expression: field.expression,
      levelText: str,
    })

    loadData(d)
  }

  function loadData(d) {
    let oldData = data
    data = d
  
    log('Loading level data:', data)

    if (!level) {
      field.setExpression(mathquillToMathJS(data.expression))
      ui.setExpressionLatex(data.expression)
    }

    if (level) {
      level.destroy()
    }

    log('Booting level:', data.level)

    level = Level({
      parent: self,
      levelCompleted,
      data: data.level,
      debug: true,
    })
  }
  
  function startRunning() {
    engine.raiseMessage('startRunning')

    running = true
    
    ui.mathField.blur()
    ui.expressionEnvelope.setAttribute('disabled', true)
    
    self.sendEvent('startRunning', [])
    
    engine.requestDraw()
  }
  
  function stopRunning() {
    engine.raiseMessage('stopRunning')

    runTime = 0
    running = false
    
    ui.mathField.blur()
    ui.expressionEnvelope.setAttribute('disabled', false)

    victory.hide()
    
    setTimeout(() => {
      if (!editing)
        ui.mathField.focus()
    }, 250)
    
    self.sendEvent('stopRunning', [])
    
    engine.requestDraw()
  }
  
  function toggleRunning() {
    if (running) stopRunning()
    else startRunning()
  }

  function startEditing() {
    editing = true
    ui.editor.setAttribute('hide', false)
    // ui.expressionEnvelope.setAttribute('disabled', true)
    ui.levelText.focus()
  }

  function stopEditing() {
    editing = false
    ui.mathField.focus()
    ui.editor.setAttribute('hide', true)
    // ui.expressionEnvelope.setAttribute('disabled', false)
  }
  
  function toggleEditing() {
    if (editing) stopEditing()
    else startEditing()
  }

  function restart() {
    stopRunning()

    const e = data.level.expression

    ui.setExpressionLatex(e)
    field.setExpression(mathquillToMathJS(e))

    writeData()
  }

  function levelCompleted() {
    victory.show(runTime, 0)

    engine.raiseMessage('victory', {
        duration: runTime,
    })
  }

  function writeData() {
    const data = Data({
      expression: field.expression,
      levelText: ui.levelText.value
    })

    data.write()
  }

  function openDataPage() {
    const dataPage = window.open()
    dataPage.document.write(data.toString().replaceAll('\n', '<br>'))
  }
  
  // HTML Events

  function onChangeExpression(text, latex) {
    field.setExpression(text)
    writeData()
  }

  function onChangeLevelText(text) {
    console.log('Level text changed to:', text)
    loadLevelText(text)
    writeData()
  }

  function onClickRunButton() {
    toggleRunning()
  }

  ui.runButton.addEventListener('click', onClickRunButton)

  function onClickRestartButton() {
    restart()
  }

  ui.restartButton.addEventListener('click', onClickRestartButton)

  function onKeyUp(event) {
    if (event.keyCode === 13) {
      if (event.shiftKey) {
        if (running)
          stopRunning()
          
        toggleEditing()
      }
      else if (editing) {
        
      }
      else
        toggleRunning()
    }
    if (event.keyCode === 27) {
      if (event.shiftKey)  {
        openDataPage()
        event.preventDefault()
      }
    }
  }

  window.addEventListener("keyup", onKeyUp)

  function onKeyDown(event) {
    if (event.keyCode === 13) {
      if (event.shiftKey) {
        event.preventDefault()
      }
    }
  }

  window.addEventListener("keydown", onKeyDown)
  
  return self.extend({
    start,
    tick,
    draw,
    
    toggleRunning,

    onChangeExpression,
    onChangeLevelText,
  })
}