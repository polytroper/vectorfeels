function World(spec) {
  const {
    self,
    screen,
    engine,
    log,
  } = Entity(spec, 'World')

  let editing = false
  let running = false
  let runTime = 0

  let data = Data(spec.data)
  let level

  // The current active edit-mode bundle
  let bundle

  // The build-mode-specified bundle
  let buildBundle

  // The edit-mode-specified bundle
  let editBundle

  // Whether the bundle has diverged from the buildBundle yet
  let diverged = false

  self.essentials.ctx = screen.ctx
  self.essentials.world = self
  
  const camera = Camera({
    parent: self,
    // debug: true,
  })

  self.essentials.camera = camera
  
  const ui = Ui({
    parent: self,
  })
  
  const field = VectorField({
    parent: self,
  })
  
  const victory = Victory({
    parent: self,
  })
  
  const axes = Axes({
    parent: self,
  })

  const assets = Assets({
    paths: ASSETS,
    callbacks: {
      complete: assetsComplete,
      progress: assetsProgress,
    }
  })
  
  self.essentials.assets = assets
  self.essentials.field = field

  function start() {
    loadData(data)
    modeChanged()
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

  function loadData(d) {
    const _level = level
    let oldData = data
    data = d

    if (!_level) {
      bundle = EvaluatorBundle({
        latexs: d.expressions,
        externalVariables: ['t', 'p', 'x', 'y'],
        scope: {
          dt: engine.tickDelta,
          pi: PI,
          tau: TAU,
        },
        level,
      })

      diverged = false
      ui.setShowRestartButton(diverged)
      buildBundle = bundle.clone()
      editBundle = bundle.clone()
      ui.scroll.setExpressions(data.expressions)
    }
  }

  function loadBundle(b) {
    bundle = b.clone()
    editBundle = b.clone()
    ui.setShowRestartButton(diverged)
    ui.scroll.setExpressions(bundle.latexs)
    self.sendEvent('onChangeBundle', [bundle])
  }
  
  function startRunning() {
    engine.raiseMessage('startRunning')

    running = true
    
    //ui.mathField.blur()
    //ui.expressionEnvelope.setAttribute('disabled', true)
    
    self.sendEvent('startRunning', [])

    ui.setShowRestartButton(false)
    
    engine.requestDraw()
    modeChanged()
  }
  
  function stopRunning() {
    engine.raiseMessage('stopRunning')

    runTime = 0
    running = false
    
    //ui.mathField.blur()
    //ui.expressionEnvelope.setAttribute('disabled', false)

    victory.hide()
    console.log('Loading edit bundle: ', editBundle)
    loadBundle(editBundle)
    
    setTimeout(() => {
      //if (!editing)
        //ui.mathField.focus()
    }, 250)
    
    self.sendEvent('stopRunning', [])
    
    engine.requestDraw()
    modeChanged()
  }
  
  function toggleRunning() {
    if (running) stopRunning()
    else startRunning()
  }

  function modeChanged() {
    console.log('Mode changed to ', self.mode)
    self.sendEvent('onModeChanged', [self.mode])
  }

  function startEditing() {
    editing = true
    modeChanged()
  }

  function stopEditing() {
    editing = false
    modeChanged()
  }
  
  function toggleEditing() {
    if (editing) stopEditing()
    else startEditing()
  }

  function restart() {
    stopRunning()

    diverged = false
    loadBundle(buildBundle)

    writeData()
  }

  function levelCompleted() {
    victory.show(runTime, 0)

    engine.raiseMessage('victory', {
        duration: runTime,
    })
  }

  function getDiverged() {
    if (editBundle.count != buildBundle.count)
      return true
    
    for (let i = 0; i < editBundle.count; i++) {
      if (editBundle.latexs[i] != buildBundle.latexs[i])
        return true
    }

    return false
  }

  function writeData() {
    const data = Data({
      expressions: [...ui.scroll.serialize()],
    })

    data.write()
  }

  function openDataPage() {
    const dataPage = window.open()
    dataPage.document.write(data.toString().replaceAll('\n', '<br>'))
  }

  function save() {
    writeData()
  }

  function modify() {
    if (self.mode == 2) {
      buildBundle = bundle.clone()
      editBundle = bundle.clone()
    }
    else if (self.mode == 1) {
      editBundle = bundle.clone()
    }

    diverged = getDiverged()
    ui.setShowRestartButton(diverged && self.mode == 1)
  }

  // Asset Loading Events
  
  function assetsComplete() {
    console.log(`All World assets loaded`)
    
    ui.loadingVeilString.innerHTML = 'click to begin'
    ui.loadingVeil.addEventListener('click', loadingVeilClicked)
  }
  
  function assetsProgress(progress, total) {
    console.log(`Loaded ${progress} of ${total} assets`)
    
    ui.loadingVeilString.innerHTML = `loading…<br>${Math.round(100*progress/total)}%`
  }
  
  function loadingVeilClicked() {
    console.log(`Loading veil clicked`)
    
    const lv = d3.select(ui.loadingVeil)
    
    lv.style('opacity', '1')
      .transition()
        .duration(1000)
        .style('opacity', '0')
      .on('end', v => {
        lv.style('display', 'none')
      })
  }
  
  // HTML Events

  function onChangeLatexs(latexs, write=true) {
    // console.log('Expressions changed to:', expressions)
    // console.log('Mathjs: ', expressions.map(mathquillToMathJS))
    
    if (level) {
      level.destroy()
    }

    level = Level({
      parent: self,
      levelCompleted,
      data: {},
      debug: true,
    })

    bundle = EvaluatorBundle({
      latexs,
      externalVariables: ['t', 'p', 'x', 'y'],
      scope: {
        dt: engine.tickDelta,
        pi: PI,
        tau: TAU,
      },
      level,
    })

    modify()

    self.sendEvent('onChangeBundle', [bundle])

    if (write)
      writeData()
  }

  function onChangeBundle() {
    if (bundle.valid) {
      ui.setMessage('')
    }
    else if (!bundle.compiles) {
      ui.setMessage('Does not compile!')
    }
    else if (!bundle.complete) {
      ui.setMessage('Unknown variable!')
    }
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
    
    save,
    modify,
    toggleRunning,

    onChangeBundle,
    onChangeLatexs,

    get running() {return running},
    get runTime() {return runTime},
    get bundle() {return bundle},

    get mode() {
      if (running)
        return 0
      if (editing)
        return 2
      return 1
    },
  })
}