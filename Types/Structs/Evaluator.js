function Evaluator(spec) {
  const self = {}
  
  const {
    scope = {},
    priors = [],
    externalVariables = [],

    allowInfinity = false,
    allowComplex = true,
    forceNumerical = false,

    mode,
    level,
    final = false,
    onFinalDirty = null,
  } = spec

  let {
    latex,
  } = spec

  let expression = mathquillToMathJS(latex)

  // Mute tildes
  if (expression == '-')
    expression = ''

  // Can we evaluate this expression?
  let valid

  // Does this expression successfully compile?
  let compiles
  
  // Can we guarantee that the value of this expression will never change?
  let constant

  // Can we find all dependencies of this expression?
  let complete

  // Is this expression a draggable constant, in plain real or complex form?
  let draggable

  // Does this expression assign a named value to the scope?
  let assignment

  // Does this expression define a function?
  let definition

  // Parameters for the function defined in this expression
  let parameters = []

  // Object returned or assigned by this expression (if any)
  let object

  // Spawned object specification returned by this expression (if any)
  let spawn
  
  // The error message, if any exists
  let error

  // Parsed math.js expression
  let tree

  // Compiled math.js expression
  let eval

  // Array of references in this expression. A reference is a string key for any named object within the expression.
  let references = []

  // Array of variables in this expression. A variable is a string key for a reference whose value can change and impact the value of this Evaluator.
  let variables = []

  // Array of dependencies for this expression. Each variable has a "dependency", an object that stores data about each variable (ex, whether or not it has changed)
  let dependencies = []

  // Dependencies that are rooted in a prior evaluator
  let dependencyPriors = []

  // Dictionary mapping of dependency names to dependency objects
  let dependencyMap = {}

  // Array of evaluators that depend on this evaluator
  let dependents = []

  // Does this evaluator need to be re-evaluated? ie, have any dependencies changed?
  let dirty = true

  // The current value of this evaluator
  let value

  // The total number of evaluations that have been executed
  let evaluations = 0

  // Assignment name (eg, c=3+2i assigns to 'c')
  let name

  // A list of valid element types
  const elementTypes = ['Collector', 'FixedGoal', 'FreeGoal']

  // Check if format is appropriate for a draggable constant (plain real or complex assignment assignment)
  const match = (expression || '').match(/^(\w[\w\d]*)\s*=(.*)$/)
  draggable = false
  if (match) {
    variableString = match[1]
    valueString = match[2]

    try {
      const c = math.complex(match[2])
      draggable = true
    }
    catch (ex) {}
  }

  // Compile!
  try {
    tree = math.parse(expression || '')

    assignment = (tree.object && _.has(tree.object, 'name')) ? true : false
    definition = _.has(tree, 'params')
    
    if (definition) {
      name = tree.name
      parameters = [...tree.params]
    }
    else if (assignment) {
      name = tree.object.name
      scope[name] = 0
    }

    references = _.uniq(tree.filter(v => v.name).map(v => v.name))
    _.pull(references, 'i', name, ...parameters)
    
    variables = _.without(references, ..._.keys(math))
    
    dependencies = _.map(variables, v => {
      const prior = _.some(priors, p => p.name == v)
      const external = _.includes(externalVariables, v)
      
      return {
        name: v,
        changed: true,
        prior,
        external,
        found: prior || external,
        evaluator: prior ? _.find(priors, p => p.name == v) : null,
      }
    })
    
    dependencies.sort((a, b) => {
      if (a.external && b.external)
        return a.name.localeCompare(b.name)

      if (a.external)
        return -1

      if (b.external)
        return 1
      
      if (a.prior && b.prior)
        return _.indexOf(priors, a.evaluator)-_.indexOf(priors, b.evaluator)

      return 0
    })

    // Reassign a sorted array back to variables
    variables = _.map(dependencies, 'name')
    
    dependencyPriors = _.filter(dependencies, 'prior')
    dependencyMap = _.zipObject(variables, dependencies)

    for (dependency of dependencyPriors)
      dependency.evaluator.dependents.push(self)
    
    constant = dependencies.length == 0
    complete = constant || _.every(dependencies, 'found')

    eval = math.compile(expression || '')
    compiles = true
    valid = compiles && complete
  }
  catch (ex) {
    error = ex.message
    compiles = false
    definition = false
    valid = false
  }

  // Ensure that all external variables have an initial value declared in scope
  for (variable of externalVariables) {
    if (!_.has(scope, variable))
      scope[variable] = 0
  }
  
  // That's it! We're done! Let's declare our methods and return this evaluator, ready for sampling
  // ----------------------

  function markChanged(key) {
    if (!definition) {
      dependencyMap[key].changed = true
      dirty = true
    }

    for (dependent of dependents)
      dependent.markChanged(name)
  }

  function evaluateIfDirty() {
    if (dirty)
      return evaluate()

    return value
  }

  function evaluate() {
    // Ensure that all prior dependencies have been evaluated and assigned to scope
    for (dependency of dependencyPriors)
      dependency.evaluator.evaluateIfDirty()

    if (!valid) {
      value = 0
      return
    }
    
    const _value = value
    
    try {
      // Evaluate
      let v = eval.evaluate(scope)
      
      // Coerce infinite values
      if (!allowInfinity) {
        if (v == PINF || v == NINF)
          v = 0
          
        if (v.re == PINF || v.re == NINF)
          v.re = 0
          
        if (v.im == PINF || v.im == NINF)
          v.im = 0
      }
      
      // Coerce value if necessary
      if (!allowComplex && math.isComplex(v))
        v = v.re || 0
      if (forceNumerical && !math.isNumerical(v))
        v = math.makeNumerical(v)

      value = v
    }
    catch (ex) {
      // console.error(`Error when evaluating expression ${expression}: `, ex)
      value = 0
    }

    // Set object if one exists
    if (_.isObject(value) && !value.__proto__.type)
      object = value
    else
      object = null

    // Set spawned object if one exists, and notify the injected event handler if one exists
    if (object && object.type && _.includes(elementTypes, object.type)) {
      if (!spawn) {
        spawn = value
        if (level)
          level.spawn(value)
      }
      else if (!_.isMatch(value, _value)) {
        if (value.type != _value.type) {
          spawn = value
          if (level) {
            level.despawn(_value)
            level.spawn(value)
          }
        }
        else {
          spawn = value
          if (level)
            level.mutate(_value, value)
        }
      }
    }
    else if (spawn) {
      spawn = null
      if (level)
        level.despawn(_value)
    }

    dirty = false
    for (dependency of dependencies)
      dependency.changed = false

    if (value != _value) {
      // console.log('Notifying dependents of ', expression)
      for (dependent of dependents) {
        dependent.markChanged(name)
        // console.log('Notifying change in dependent ', dependent)
      }
    }

    evaluations++
    
    return value
  }

  function setConstantExpression(_expression) {
    if (!draggable)
      throw 'Trying to set the expression of a non-constant evaluator!'

    dirty = _expression != expression
    // console.log('Setting constant expression to ', _expression, dirty)
    
    expression = _expression
    latex = expression
    eval = math.compile(expression)
    tree = math.parse(expression)
    evaluateIfDirty()

    if (final)
      onFinalDirty()
      
    for (dependent of dependents)
      dependent.markChanged(name)
  }

  function toString() {
    return `${expression}
    variables: ${name}
    assignment: ${assignment}
    name: ${name}
    compiles: ${compiles}
    tree: ${tree ? tree : ''}
    `
  }

  return _.mixIn(self, {
    get latex() {return latex},
    get expression() {return expression},
    
    mode,
    valid,
    compiles,
    complete,
    constant,
    assignment,
    definition,
    parameters,
    references,
    variables,
    dependencies,
    dependents,
    error,
    name,

    tree,
    eval,

    markChanged,
    evaluate,
    evaluateIfDirty,
    setConstantExpression,

    get value() {return evaluateIfDirty()},
    get dirty() {return dirty},
    get evaluations() {return evaluations},

    toString,
  })
}

// Tests
(() => {
//  LOGTESTS = true
  
  const scope = {
    get t() {return 0},
    get dt() {return 1/30},

    get pi() {return PI},
    get tau() {return TAU},
  }

  let e

  e = Evaluator({
    scope: {...scope},
    latex: '0',
  })
  
  Test(e.valid).isTrue()
  Test(e.compiles).isTrue()
  Test(e.constant).isTrue()
  Test(e.complete).isTrue()
  Test(e.value).equals(0)

  // Test built-in function reference
  e = Evaluator({
    scope: {...scope},
    latex: 'sin(0)',
  })
  
  Test(e.valid).isTrue()
  Test(e.compiles).isTrue()
  Test(e.constant).isTrue()
  Test(e.complete).isTrue()
  Test(e.assignment).isFalse()
  Test(e.definition).isFalse()
  Test(e.value).equals(0)

  e = Evaluator({
    scope: {...scope, c: 0},
    latex: 'c=5+2i',
  })

  Test(e.valid).isTrue()
  Test(e.compiles).isTrue()
  Test(e.constant).isTrue()
  Test(e.complete).isTrue()
  Test(e.dirty).isTrue()
  Test(e.value).equals(math.complex(5, 2))
  Test(e.dirty).isFalse()
  Test(e.references).equals([])
  Test(e.name).equals('c')

  e = Evaluator({
    scope: {...scope},
    latex: 'c=5+2i+d',
  })

  Test(e.valid).isFalse()
  Test(e.compiles).isTrue()
  Test(e.constant).isFalse()
  Test(e.complete).isFalse()
  Test(e.dirty).isTrue()
  Test(e.references).equals(['d'])
  Test(e.variables).equals(['d'])
  Test(e.name).equals('c')

  e = Evaluator({
    scope: {...scope, b: 1, a: 2},
    externalVariables: ['t', 'b', 'a'],
    latex: 't+a+b',
  })

  Test(e.valid).isTrue()
  Test(e.compiles).isTrue()
  Test(e.constant).isFalse()
  Test(e.complete).isTrue()
  Test(e.dirty).isTrue()
  Test(e.variables).equals(['a', 'b', 't'])
  Test(e.value).equals(3)
  Test(e.dirty).isFalse()

  // Test function assignment
  e = Evaluator({
    scope: {...scope},
    externalVariables: [],
    latex: 'test(c)=c+2',
  })

  Test(e.valid).isTrue()
  Test(e.assignment).isFalse()
  Test(e.definition).isTrue()
  Test(e.parameters).equals(['c'])
  Test(e.name).equals('test')
})()