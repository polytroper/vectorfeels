function EvaluatorBundle(spec) {
  const {
    latexs,
    externalVariables = [],
    scope,
    level,
  } = spec

  // The current value of this bundle
  let value

  // Whether this bundle needs to be re-evaluated
  let dirty = true

  // Generate evaluators from expressions. Null expression indicates mode shift
  const evaluators = []

  // Compute index of final non-empty expression
  let finalIndex = -1
  for (let i = 0; i < latexs.length; i++) {
    if (latexs[i] != '' && latexs[i] != null)
      finalIndex = i
  }

  let mode = _.reduce(latexs, (r, v) => v == null ? r+1 : r, 0)
  _.each(latexs, (latex, i) => {
    if (latex == null) {
      mode--
      // continue
    }
    
    evaluators.push(Evaluator({
      latex,
      priors: [...evaluators],
      externalVariables,
      scope,
      level,
      mode,
      final: i == finalIndex,
      onFinalDirty,
    }))
  })

  const finalEvaluator = _.last(evaluators.filter(v => v.expression != ''))

  // Record basic properties from evaluators
  const valid = _.every(evaluators, 'valid')
  const compiles = _.every(evaluators, 'compiles')
  const complete = _.every(evaluators, 'complete')

  const assignments = evaluators.filter(v => v.assignment)
  const definitions = evaluators.filter(v => v.definition)
  const constants = evaluators.filter(v => v.constant)

  const errors = _.map(evaluators, 'error')

  // Map each dependency name to the evaluators that depend on it
  const dependencyMap = {}
  for (evaluator of evaluators) {
    for (key of evaluator.variables) {
      if (!_.has(dependencyMap, key))
        dependencyMap[key] = []
      
      dependencyMap[key].push(evaluator)
    }
  }

  // Create a dependency map specifically for external variables
  const externalDependencyMap = _.zipObject(externalVariables, externalVariables.map(v => dependencyMap[v] || []))

  // Create stringified dependency maps for debugging
  const dependencyMapStrings = _.mapValues(dependencyMap, arr => _.map(arr, v => v.expression))
  const externalDependencyMapStrings = _.mapValues(externalDependencyMap, arr => _.map(arr, v => v.expression))

  // Evaluate everything
  _.each(evaluators, v => v.evaluate())

  // That's it! We're done! Let's declare our methods and return this bundle, ready for sampling
  // ----------------------

  function sample() {
    // Assign variable/value pairs
    if (arguments.length >= 2) {
      for (let i = 0; i < arguments.length; i += 2) {
        const key = arguments[i]
        const value = arguments[i+1]

        assign(key, value)
      }
    }
    
    return evaluateIfDirty()
  }

  function assign(key, value) {
    const dependents = externalDependencyMap[key]

    if (!dependents) {
      console.error(`Attempting to assign variable ${key}, but it was never declared as external!`)
      return
    }

    // TODO: Fix this optimization so it doesn't break multiple assignments of a single complex value that is being externally mutated (which perhaps is a bad idea in the first place)
    // if (math.equal(scope[key], value))
      // return

    scope[key] = value
    
    if (dependents.length == 0)
      return
      
    for (evaluator of dependents)
      evaluator.markChanged(key)
    
    dirty = finalEvaluator.dirty
  }

  function evaluate() {
    if (!finalEvaluator)
      value = 0
    else
      value = finalEvaluator.value

    dirty = false
    
    return value
  }

  function evaluateIfDirty() {
    if (dirty)
      return evaluate()

    return value
  }

  function markDirty() {
    dirty = true
  }

  function toString() {
    return evaluators.map(v => v.toString()).join('\n')
  }

  function clone() {
    return EvaluatorBundle({
      latexs: evaluators.map(v => v.latex),
      externalVariables,
      scope: _.cloneDeep(scope),
    })
  }

  function onFinalDirty() {
    markDirty()
  }

  return {
    scope,
    get latexs() {return evaluators.map(v => v.latex)},
    get expressions() {return evaluators.map(v => v.expression)},
    externalVariables,
    
    evaluators,

    valid,
    compiles,
    complete,
    errors,

    sample,
    assign,
    evaluate,
    evaluateIfDirty,

    get dirty() {return dirty},
    get value() {return evaluateIfDirty()},
    get evaluations() {
      return _.reduce(evaluators, (sum, v) => sum+v.evaluations, 0)
    },
    get count() {return evaluators.length},

    toString,
    clone,

    dependencyMap,
    externalDependencyMap,
    
    dependencyMapStrings,
    externalDependencyMapStrings,
  }
}

// Tests
(() => {
  const scope = {
    get t() {return 0},
    get dt() {return 1/30},

    get pi() {return PI},
    get tau() {return TAU},
  }

  let b

  // Test trivial definition of two expressions
  b = EvaluatorBundle({
    scope: {...scope},
    latexs: ['0', '1'],
  })
  
  Test(b.valid).isTrue()
  Test(b.compiles).isTrue()
  Test(b.complete).isTrue()
  Test(b.evaluators[0].value).equals(0)
  Test(b.evaluators[1].value).equals(1)
  Test(b.value).equals(1)

  // Test variable definition/reference
  b = EvaluatorBundle({
    scope: {...scope},
    latexs: ['c=5', 'b=c'],
  })

  Test(b.valid).isTrue()
  Test(b.value).equals(5)
  Test(b.evaluators[0].value).equals(5)

  // Test out-of-order variable definition/reference
  b = EvaluatorBundle({
    scope: {...scope},
    latexs: ['b=c', 'c=5'],
  })

  Test(b.valid).isFalse()

  // Test definition/reference of multiple variables
  b = EvaluatorBundle({
    scope: {...scope},
    externalVariables: ['t'],
    latexs: ['c=5', 'b=c', 'b+t+c+5'],
  })
  
  Test(b.valid).isTrue()
  Test(b.evaluators[2].variables).equals(['t', 'c', 'b'])
  // Test(b.evaluators[0].dirty).isTrue()
  // Test(b.evaluators[1].dirty).isTrue()
  // Test(b.evaluators[2].dirty).isTrue()
  Test(b.value).equals(15)

  // Test definition/reference of chained variables
  b = EvaluatorBundle({
    scope: {...scope},
    latexs: ['c=5', 'a=c+2', 'b=c', 'd=a-2', 'd+a+b'],
  })
  
  Test(b.valid).isTrue()
  Test(b.value).equals(17)
  Test(b.evaluations).equals(5)
  
  // Test assignment of external variable
  b = EvaluatorBundle({
    scope: {...scope},
    externalVariables: ['t'],
    latexs: ['c=5', 'a=c+t', 'a'],
  })

  Test(b.valid).isTrue()
  Test(b.value).equals(5)
  Test(b.evaluations).equals(3)
  Test(b.sample('t', 0)).equals(5)
  // Reinstate this test once the "redundant assignments" optimization is fixed?
  // Test(b.evaluations).equals(3)
  Test(b.evaluators[1].dirty).isFalse()

  b.assign('t', 1)
  Test(b.scope.t).equals(1)
  Test(b.evaluators[1].dirty).isTrue()
  Test(b.evaluators[2].dirty).isTrue()
  Test(b.value).equals(6)
  Test(b.evaluators[1].dirty).isFalse()
  Test(b.evaluators[2].dirty).isFalse()
  // Reinstate this test once the "redundant assignments" optimization is fixed?
  // Test(b.evaluations).equals(5)
  
  Test(b.sample('t', 2)).equals(7)
  // Reinstate this test once the "redundant assignments" optimization is fixed?
  // Test(b.evaluations).equals(7)
  
  // Test assignment of multiple external variables
  b = EvaluatorBundle({
    scope: {...scope},
    externalVariables: ['t', 'p'],
    latexs: ['c=5', 'a=c+t', 'b=a+p', 'a+b'],
  })

  Test(b.valid).isTrue()
  Test(b.value).equals(10)
  Test(b.evaluations).equals(4)
  Test(b.sample('t', 1)).equals(12)
  Test(b.evaluations).equals(7)
  Test(b.sample('p', 2)).equals(14)
  Test(b.evaluations).equals(9)
  Test(b.sample('t', 2, 'p', 3)).equals(17)
  Test(b.evaluations).equals(12)
  
  // Test assignment of complex external variables
  b = EvaluatorBundle({
    scope: {...scope},
    externalVariables: ['p'],
    latexs: ['c=5', 'a=c+p', 'a'],
  })
  
  Test(b.valid).isTrue()
  Test(b.value).equals(5)
  Test(b.sample('p', 2)).equals(7)
  Test(b.sample('p', math.complex(1, 1))).equals(math.complex(6, 1))
  
  // Test assignment of functions
  b = EvaluatorBundle({
    scope: {...scope},
    externalVariables: ['a'],
    latexs: ['test(c)=c+2+a', 'test(1)'],
  })
  Test(b.valid).isTrue()
  Test(b.value).equals(3)
  Test(b.evaluations).equals(2)
  Test(b.sample('a', 5)).equals(8)
  Test(b.evaluations).equals(3)

  // Test determination of finality
  b = EvaluatorBundle({
    scope: {...scope},
    externalVariables: [],
    latexs: ['1', '2', '3'],
  })
  Test(b.evaluators[0].final).isFalse()
  Test(b.evaluators[1].final).isFalse()
  Test(b.evaluators[2].final).isTrue()

  // Test determination of finality with empty expressions on end
  b = EvaluatorBundle({
    scope: {...scope},
    externalVariables: [],
    latexs: ['1', '2', '3', null, ''],
  })
  Test(b.evaluators[0].final).isFalse()
  Test(b.evaluators[1].final).isFalse()
  Test(b.evaluators[2].final).isTrue()
  Test(b.evaluators[3].final).isFalse()
  Test(b.evaluators[4].final).isFalse()

  // Test assignment of constant expression
  b = EvaluatorBundle({
    scope: {...scope},
    externalVariables: [],
    latexs: ['c=1+i', 'c', '2'],
  })
  b.evaluators[0].setConstantExpression('c=2')
  Test(b.evaluators[1].value).equals(2)

  // Test assignment of constant expression when constant referenced in final expression
  b = EvaluatorBundle({
    scope: {...scope},
    externalVariables: [],
    latexs: ['c=1+3i', 'c'],
  })
  Test(b.evaluators[1].final).isTrue()
  Test(b.value.re).equals(1)
  Test(b.value.im).equals(3)
  b.evaluators[0].setConstantExpression('c=2')
  Test(b.evaluators[1].dirty).isTrue()
  Test(b.dirty).isTrue()
  Test(b.value).equals(2)
})()