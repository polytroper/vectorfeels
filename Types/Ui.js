function Ui(spec) {
  const self = {}
  
  const {
    canvas,
    screen,
    engine,
  } = spec

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
  
  const mathFieldStatic = MQ.StaticMath($('#math-field-static'))
  
  const mathField = MQ.MathField($('#math-field'), {
    handlers: {
      edit: function() {
        if (writingExpression)
          return

        const text = self.mathField.text()
        const latex = self.mathField.latex()
        mathFieldStatic.latex(latex)
        
        console.log(`Expression text changed to: `, text)
        engine.world.sendEvent('onChangeExpression', [text, latex])
      }
    }
  })
  
  mathField.text = function() {
    var tex = self.mathField.latex()
    return mathquillToMathJS(tex)
  }

  levelText.addEventListener('input', (event) => {
    if (writingLevelText)
      return

    engine.world.sendEvent('onChangeLevelText', [levelText.value])
  })

  function setExpressionLatex(latex) {
    console.log('Setting expression latex: ', latex)
    writingExpression = true
    mathField.latex(latex)
    mathFieldStatic.latex(latex)
    writingExpression = false
  }

  function setExpression(text) {
    setExpressionLatex(math.toTex(text))
  }

  function setLevelText(text) {
    writingLevelText = true
    levelText.value = text
    writingLevelText = false
  }
  
  return _.mixIn(self, {
    expressionEnvelope,

    variableLabel,

    restartButton,

    runButton,
    runButtonString,
    
    mathField,
    mathFieldStatic,

    editor,
    levelText,

    setExpression,
    setExpressionLatex,
    setLevelText,
  })
}