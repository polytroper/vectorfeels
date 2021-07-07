function Ui(spec) {
  const self = {}
  
  const {
    canvas,
    screen,
    engine,
  } = spec

  const controlBar = $('#controls-bar')
  
  const variableLabel = $('#variable-label')
  
  const mathFieldStatic = MQ.StaticMath($('#math-field-static'))
  
  const mathField = MQ.MathField($('#math-field'), {
    handlers: {
      edit: function() {
        const text = self.mathField.getPlainExpression()
        const latex = self.mathField.latex()
        console.log(`Expression text changed to: `, text)
        engine.world.sendEvent('setGraphExpression', [text, latex])
      }
    }
  })
  
  mathField.getPlainExpression = function() {
    var tex = self.mathField.latex()
    return mathquillToMathJS(tex)
  }

  function setExpression(latex) {
    mathField.latex(latex)
    mathFieldStatic.latex(latex)
  }
  
  return _.mixIn(self, {
    variableLabel,
    
    mathField,
    mathFieldStatic,

    setExpression,
  })
}