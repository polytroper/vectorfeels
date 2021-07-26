// Welcome to app.js, where we lay out some global constants and start the engine

// Global debug variable that will cause all logs to pass when true
var DEBUG = false

// Declare version
const VERSION = '0.0.0'

// Default level string
const DEFAULT_LEVEL = `expression: cos(y)+sin(x)*i
Collector:
  - x: -4
    y: 2
FixedGoal:
  - x: 4
    y: 2
  - x: 4
    y: -2
`

// Create a MathQuill interface
const MQ = MathQuill.getInterface(2);

console.log('Launching VectorFeels')

// Alright here we go
Engine({
  stepping: false,
  canvas: $('#canvas'),
})